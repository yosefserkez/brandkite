import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getWorkflowRegistry } from './workflows/registry';
import { WorkflowContext } from './workflows/types';
import { queueModulesForGeneration, reprocessGenerationQueue } from './workflows/orchestrator';
import { BRAND_MODULE_TYPES, BrandModuleType, brandModuleTypeValidator } from './workflows/modules';
import { logger } from './logger';

export const generateBrandModule = internalAction({
  args: {
    companyDescription: v.string(),
    moduleType: brandModuleTypeValidator,
    existingModules: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const log = logger.withContext({
      moduleType: args.moduleType,
      step: 'generateBrandModule'
    });
    
    log.debug('Starting brand module generation', {
      existingModuleCount: args.existingModules.length,
      existingModuleTypes: args.existingModules.map(m => m.type)
    });
    
    // Convert existing modules array to a map
    const existingModulesMap = args.existingModules.reduce((acc, module) => {
      acc[module.type] = module.data;
      return acc;
    }, {} as Record<string, any>);

    // Get the workflow for this module type
    const registry = getWorkflowRegistry();
    const workflow = registry.get(args.moduleType);
    
    if (!workflow) {
      log.error('Workflow not found for module type', { moduleType: args.moduleType });
      throw new Error(`No workflow found for module type: ${args.moduleType}`);
    }

    // Create context once
    const context: WorkflowContext = {
      companyId: '', // Not needed for generation
      companyDescription: args.companyDescription,
      existingModules: existingModulesMap,
      ctx,
    };

    // Check dependencies if the workflow has validation
    if (workflow.validateDependencies && !workflow.validateDependencies(context)) {
      log.error('Dependencies not met for module', {
        moduleType: args.moduleType,
        dependencies: workflow.dependencies
      });
      throw new Error(`Dependencies not met for module type: ${args.moduleType}`);
    }

    log.debug('Executing workflow', { moduleType: args.moduleType });
    // Execute the workflow
    const result = await workflow.generate(context);
    log.info('Workflow execution completed', { moduleType: args.moduleType });
    
    return result.data;
  },
});

export const generateInitialBrand = internalAction({
  args: {
    companyId: v.id("companies"),
    description: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const log = logger.withContext({
      companyId: args.companyId,
      userId: args.userId,
      step: 'generateInitialBrand'
    });
    
    log.info('Starting initial brand generation');
    
    // Default group: a concise set of atomic modules to bootstrap a brand
    const moduleTypes: BrandModuleType[] = [...BRAND_MODULE_TYPES].filter(type => type !== 'tagline') as BrandModuleType[];
    
    log.debug('Module types to generate', { moduleTypes, count: moduleTypes.length });
    
    // Use orchestrator to queue all modules with proper dependency handling
    await queueModulesForGeneration(ctx, args.companyId, moduleTypes, args.description);
    
    log.info('Initial brand generation queued');
  },
});

/**
 * Process the generation queue with dependency handling
 */
export const processGenerationQueueAction = internalAction({
  args: {
    companyId: v.id("companies"),
    attemptNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await reprocessGenerationQueue(ctx, args.companyId, args.attemptNumber ?? 0);
  },
});
