import { BrandModuleWorkflow, WorkflowRegistry } from './types';
import * as workflowModules from './modules';
import type { BrandModuleType } from './modules';

/**
 * Create the workflow registry with all module workflows
 */
export function createWorkflowRegistry(): WorkflowRegistry {
  const registry = new Map<BrandModuleType, BrandModuleWorkflow>();

  // Automatically register all exported workflow classes
  for (const [name, WorkflowClass] of Object.entries(workflowModules)) {
    // Check if it's a workflow class (has moduleType property when instantiated)
    if (typeof WorkflowClass === 'function') {
      try {
        const workflow = new (WorkflowClass as new () => BrandModuleWorkflow)();
        if (workflow.moduleType) {
          registry.set(workflow.moduleType, workflow);
        }
      } catch (error) {
        // Skip if instantiation fails (might not be a workflow class)
        console.warn(`Failed to register workflow ${name}:`, error);
      }
    }
  }

  return registry;
}

/**
 * Singleton instance of the workflow registry
 */
let workflowRegistryInstance: WorkflowRegistry | null = null;

export function getWorkflowRegistry(): WorkflowRegistry {
  if (!workflowRegistryInstance) {
    workflowRegistryInstance = createWorkflowRegistry();
  }
  return workflowRegistryInstance;
}

