import { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { getWorkflowRegistry } from './registry';
import { BrandModuleWorkflow, WorkflowDependency } from './types';
import type { BrandModuleType } from './modules';
import { logger } from '../logger';

/**
 * Configuration constants
 */
const MAX_QUEUE_RETRIES = 20;
const MAX_BACKOFF_DELAY_SECONDS = 10;

/**
 * Module status information
 */
interface ModuleStatus {
  type: BrandModuleType;
  hasData: boolean;
  generationStatus: 'idle' | 'queued' | 'in_progress' | 'succeeded' | 'failed';
}

/**
 * Check if all workflow dependencies are satisfied
 */
function areDependenciesSatisfied(
  dependencies: WorkflowDependency[] | undefined,
  moduleStatuses: ModuleStatus[]
): { satisfied: boolean; missingDependency?: string } {
  if (!dependencies || dependencies.length === 0) {
    return { satisfied: true };
  }

  const statusMap = new Map<string, ModuleStatus>();
  for (const module of moduleStatuses) {
    statusMap.set(module.type, module);
  }

  for (const dep of dependencies) {
    const status = statusMap.get(dep.moduleType);
    
    // If dependency requires success, check both hasData and succeeded status
    if (dep.requireSuccess) {
      if (!status || !status.hasData || status.generationStatus !== 'succeeded') {
        return { satisfied: false, missingDependency: dep.moduleType };
      }
    } else {
      // Otherwise just check if data exists
      if (!status || !status.hasData) {
        return { satisfied: false, missingDependency: dep.moduleType };
      }
    }
  }

  return { satisfied: true };
}

/**
 * Detect circular dependencies in workflow graph
 */
function detectCircularDependencies(
  moduleTypes: BrandModuleType[],
  registry: Map<string, BrandModuleWorkflow>
): void {
  // Build dependency graph
  const graph = new Map<string, string[]>();
  for (const moduleType of moduleTypes) {
    const workflow = registry.get(moduleType);
    if (workflow?.dependencies) {
      const deps = workflow.dependencies
        .filter((dep: WorkflowDependency) => moduleTypes.includes(dep.moduleType as BrandModuleType))
        .map((dep: WorkflowDependency) => dep.moduleType);
      graph.set(moduleType, deps);
    } else {
      graph.set(moduleType, []);
    }
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string, path: string[]): { hasCycle: boolean; cycle?: string[] } {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const result = hasCycle(neighbor, [...path]);
        if (result.hasCycle) {
          return result;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        return {
          hasCycle: true,
          cycle: path.slice(cycleStart).concat(neighbor),
        };
      }
    }

    recursionStack.delete(node);
    return { hasCycle: false };
  }

  // Check each component
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const result = hasCycle(node, []);
      if (result.hasCycle && result.cycle) {
        throw new Error(
          `Circular dependency detected in workflows: ${result.cycle.join(' → ')}`
        );
      }
    }
  }
}

/**
 * Add multiple modules to the generation queue with proper orchestration
 */
export async function queueModulesForGeneration(
  ctx: ActionCtx,
  companyId: any,
  moduleTypes: BrandModuleType[],
  companyDescription: string,
  inputContent?: string
): Promise<void> {
  const log = logger.withContext({ companyId, moduleTypes, step: 'queueModulesForGeneration' });
  log.info('Starting module generation queue', { moduleCount: moduleTypes.length });
  
  const registry = getWorkflowRegistry();
  
  // Check for circular dependencies before queueing
  try {
    detectCircularDependencies(moduleTypes as BrandModuleType[], registry);
    log.debug('Circular dependency check passed');
  } catch (error) {
    log.error('Circular dependency detected', { error });
    throw error;
  }
  
  // Create all modules in "queued" state
  const moduleIds: Record<string, any> = {};
  const now = Date.now();
  
  for (const moduleType of moduleTypes) {
    const moduleId = await ctx.runMutation(internal.brandModules.createQueuedModuleInternal as any, {
      companyId,
      type: moduleType,
      now,
    });
    moduleIds[moduleType] = moduleId;
    log.debug('Created queued module', { moduleType, moduleId });
  }

  log.info('All modules queued, processing generation queue', { moduleCount: Object.keys(moduleIds).length });
  // Process the queue with dependency handling
  await processGenerationQueue(ctx, companyId, moduleIds, companyDescription, inputContent);
}

/**
 * Process the generation queue, handling dependencies
 */
export async function processGenerationQueue(
  ctx: ActionCtx,
  companyId: any,
  moduleIds: Record<string, any>,
  companyDescription: string,
  inputContent?: string,
  attemptNumber: number = 0
): Promise<void> {
  const log = logger.withContext({ companyId, attemptNumber, step: 'processGenerationQueue' });
  const registry = getWorkflowRegistry();
  
  if (attemptNumber >= MAX_QUEUE_RETRIES) {
    log.error('Generation queue exceeded max retries', { maxRetries: MAX_QUEUE_RETRIES });
    // Mark remaining queued modules as failed
    const currentModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
      companyId,
    });
    
    for (const module of currentModules) {
      if (module.generationStatus === 'queued' && moduleIds[module.type]) {
        log.warn('Marking module as failed due to max retries', { moduleType: module.type });
        await ctx.runMutation(internal.brandModules.updateModuleInternal, {
          moduleId: moduleIds[module.type],
          data: null,
          setGenerationStatus: "failed",
        } as any);
      }
    }
    
    log.error('Generation queue processing exceeded max retries, returning without throwing', { maxRetries: MAX_QUEUE_RETRIES });
    return; // Don't throw - gracefully handle failure
  }

  log.debug('Processing generation queue', { attemptNumber, moduleCount: Object.keys(moduleIds).length });

  // Get current state of all modules
  const currentModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
    companyId,
  });

  // Build status map from current modules
  const moduleStatuses: ModuleStatus[] = currentModules.map(m => ({
    type: m.type as BrandModuleType,
    hasData: m.data != null,
    generationStatus: m.generationStatus,
  }));

  log.debug('Current module statuses', {
    statuses: moduleStatuses.map(s => ({ type: s.type, status: s.generationStatus, hasData: s.hasData }))
  });

  // Find modules that can be processed now (queued with satisfied dependencies)
  const modulesToProcess: Array<{ type: BrandModuleType; id: any }> = [];
  
  for (const moduleType of Object.keys(moduleIds) as BrandModuleType[]) {
    const moduleId = moduleIds[moduleType];
    const status = moduleStatuses.find(s => s.type === moduleType);
    
    // Skip if already processing or complete
    if (status && status.generationStatus !== 'queued') {
      log.debug('Skipping module - not queued', { moduleType, status: status.generationStatus });
      continue;
    }
    
    // Check dependencies
    const workflow = registry.get(moduleType);
    if (workflow) {
      const depCheck = areDependenciesSatisfied(workflow.dependencies, moduleStatuses);
      if (depCheck.satisfied) {
        modulesToProcess.push({ type: moduleType, id: moduleId });
        log.debug('Module ready to process', { moduleType, dependencies: workflow.dependencies });
      } else {
        log.debug('Module dependencies not satisfied', {
          moduleType,
          missingDependency: depCheck.missingDependency,
          dependencies: workflow.dependencies
        });
      }
    }
  }

  log.info('Modules ready to process', { count: modulesToProcess.length, modules: modulesToProcess.map(m => m.type) });

  // Process available modules
  for (const { type, id } of modulesToProcess) {
    const moduleLog = log.withContext({ moduleType: type, moduleId: id });
    moduleLog.info('Starting module generation');
    
    // Mark as in_progress
    await ctx.runMutation(internal.brandModules.updateModuleInternal, {
      moduleId: id,
      data: null,
      setGenerationStatus: "in_progress",
    } as any);

    try {
      // Schedule generation (non-blocking)
      await ctx.scheduler.runAfter(0, internal.brandModules.regenerateModuleAction, {
        companyId,
        type,
        moduleId: id,
        publish: false,
        inputContent: inputContent ?? undefined,
      } as any);
      moduleLog.debug('Module generation scheduled');
    } catch (error) {
      moduleLog.error('Failed to schedule module generation', { error });
      // Mark as failed if scheduling failed
      await ctx.runMutation(internal.brandModules.updateModuleInternal, {
        moduleId: id,
        data: null,
        setGenerationStatus: "failed",
      } as any);
    }
  }

  // Check if there are still pending modules
  const updatedModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
    companyId,
  });

  const pendingModules = updatedModules.filter(
    m => m.generationStatus === 'queued' && moduleIds[m.type]
  );

  // If there are still pending modules, schedule a retry
  if (pendingModules.length > 0) {
    const nextAttempt = attemptNumber + 1;
    const delaySeconds = Math.min(2 ** nextAttempt, MAX_BACKOFF_DELAY_SECONDS);
    
    log.info('Scheduling retry for pending modules', {
      pendingCount: pendingModules.length,
      nextAttempt,
      delaySeconds
    });
    
    await ctx.scheduler.runAfter(
      delaySeconds,
      internal.ai.processGenerationQueueAction,
      {
        companyId,
        attemptNumber: nextAttempt,
        inputContent: inputContent ?? undefined,
      } as any
    );
  } else {
    log.info('All modules processed or queued');
  }
}

/**
 * Re-process the generation queue (called after a module completes)
 */
export async function reprocessGenerationQueue(
  ctx: ActionCtx,
  companyId: any,
  attemptNumber: number = 0
): Promise<void> {
  const log = logger.withContext({ companyId, attemptNumber, step: 'reprocessGenerationQueue' });
  log.debug('Reprocessing generation queue');
  
  const currentModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
    companyId,
  });

  // Find all queued modules
  const queuedModules = currentModules.filter(m => m.generationStatus === 'queued');
  
  if (queuedModules.length === 0) {
    log.debug('No queued modules found, nothing to process');
    return; // Nothing to process
  }

  log.info('Found queued modules', { count: queuedModules.length });

  const registry = getWorkflowRegistry();
  const moduleIds: Record<string, any> = {};
  
  for (const module of queuedModules) {
    moduleIds[module.type] = module._id;
  }

  const company = await ctx.runQuery(internal.companies.getForGeneration, {
    companyId,
  });

  if (!company) {
    log.error('Company not found');
    throw new Error("Company not found");
  }

  // For reprocessing, we don't have inputContent (it's only needed for initial generation)
  await processGenerationQueue(ctx, companyId, moduleIds, company.description, undefined, attemptNumber);
}

