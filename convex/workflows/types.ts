import { ActionCtx } from "../_generated/server";
import type { BrandModuleType } from "./modules";

/**
 * Context passed to workflow generators
 */
export interface WorkflowContext {
  companyId: string;
  companyDescription: string;
  existingModules: Record<string, any>;
  ctx: ActionCtx;
}

/**
 * Workflow result
 */
export interface WorkflowResult<T = any> {
  data: T;
}

/**
 * Dependency information for workflows
 */
export interface WorkflowDependency {
  /**
   * The module type that is required
   */
  moduleType: BrandModuleType;
  
  /**
   * Whether the module needs to be successfully generated (not just queued)
   */
  requireSuccess?: boolean;
}

/**
 * Base workflow interface
 */
export interface BrandModuleWorkflow<T = any> {
  /**
   * The module type this workflow handles
   */
  moduleType: BrandModuleType;
  
  /**
   * List of dependencies this workflow requires
   * If a dependency is missing, the workflow will wait for it to be generated
   */
  dependencies?: WorkflowDependency[];
  
  /**
   * Execute the workflow to generate the module data
   */
  generate(context: WorkflowContext): Promise<WorkflowResult<T>>;
  
  /**
   * Optional: Validate that required dependencies are available
   * Called before generate() to ensure dependencies are met
   */
  validateDependencies?(context: WorkflowContext): boolean;
}

/**
 * Registry type for workflows
 */
export type WorkflowRegistry = Map<BrandModuleType, BrandModuleWorkflow>;