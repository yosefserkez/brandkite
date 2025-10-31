# Brand Module Workflows

This directory contains individual workflow implementations for generating different brand modules. Each workflow defines how a specific module type is generated, potentially using multiple AI models and processing steps.

## Architecture

The workflow system consists of:

1. **Workflow Interface** (`types.ts`): Defines the base `BrandModuleWorkflow` interface
2. **Workflow Registry** (`registry.ts`): Maps module types to their workflow implementations
3. **Orchestrator** (`orchestrator.ts`): Manages the generation queue with dependency handling
4. **Individual Workflows**: Each module type has its own workflow file

## Creating a New Workflow

To create a new workflow:

1. Create a new file in the `workflows/modules/` directory (e.g., `myModule.ts`)
2. Implement the `BrandModuleWorkflow` interface
3. Export the class from `modules/index.ts` to automatically register it

Note: All workflow classes are automatically registered when exported from `modules/index.ts`. Make sure to export your new workflow class from that file.

### Declaring Dependencies

Workflows can declare dependencies on other modules. The orchestrator manages the queue to ensure dependencies are satisfied before running:

```typescript
export class MyWorkflow implements BrandModuleWorkflow {
  moduleType = 'myModule';
  
  // Declare that this workflow requires 'vision' and 'values' modules
  dependencies = [
    { moduleType: 'vision' },
    { moduleType: 'values', requireSuccess: true }, // Must be successfully generated
  ];
  
  async generate(context: WorkflowContext): Promise<{ data: any }> {
    // At this point, vision and values are guaranteed to be available
    const vision = context.existingModules['vision'];
    const values = context.existingModules['values'];
    
    // Generate data using the dependencies
    return { data: generatedData };
  }
}
```

**Dependency behavior:**
- If a dependency is missing, the workflow waits in "queued" state
- The orchestrator automatically retries checking dependencies after each module completes
- Exponential backoff (1s, 2s, 4s, up to 10s) between retries
- Maximum 20 retries before marking as failed
- No race conditions: dependencies are checked atomically before execution
- **Circular dependencies are detected** before queueing and raise an error with the cycle path

**Example circular dependency error:**
```
Error: Circular dependency detected in workflows: moduleA → moduleB → moduleC → moduleA
```

Example:

```typescript
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from './types';

export class MyModuleWorkflow implements BrandModuleWorkflow {
  moduleType = 'myModule';

  validateDependencies(context: WorkflowContext): boolean {
    // Check if required dependencies are available
    return true;
  }

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription, existingModules, ctx } = context;
    
    // Define schema inline for AI generation
    const myModuleSchema = z.string().describe("My module description");
    
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer.',
      schema: z.object({ value: myModuleSchema }),
      schemaName: 'BrandMyModule',
      prompt: `Generate content for: "${companyDescription}"`,
      temperature: 0.7,
    });
    
    return {
      data: object.value,
    };
  }
}
```

## Workflow Examples

### Logo Workflow (`logo.ts`)

The logo workflow demonstrates a multi-step generation process:

1. **Validate Dependencies**: Check if brand name or company description exists
2. **Generate Concepts**: Use GPT-4 to generate 3 logo concept directions
3. **TODO: Generate Image**: Generate actual logo image using DALL-E or similar
4. **TODO: Convert to SVG**: Vectorize the generated image


## Workflow Context

Each workflow receives a `WorkflowContext` containing:

- `companyId`: The company ID (if needed)
- `companyDescription`: The company description
- `existingModules`: Map of existing module data by module type
- `ctx`: The Convex action context for running queries/mutations

## Orchestrator

The orchestrator (`orchestrator.ts`) manages the generation queue and handles dependencies:

- **Queue Management**: All modules are queued with their dependencies declared
- **Automatic Orchestration**: Dependencies are checked before running workflows
- **Race Condition Prevention**: Atomic dependency checking ensures no modules run without dependencies
- **Exponential Backoff**: Smart retry logic with increasing delays
- **Cascade Processing**: When a module completes, the queue is reprocessed to start dependent modules
- **Circular Dependency Detection**: Automatically detects and reports circular dependencies before queueing

### How It Works

1. All modules are created in "queued" state
2. Orchestrator checks which modules can run (dependencies satisfied)
3. Runs available modules concurrently
4. After each module completes, queue is reprocessed
5. Dependent modules start automatically when ready
6. Failed modules are marked, but don't block dependent modules indefinitely

## Benefits

- **Separation of Concerns**: Each module type has its own generation logic
- **Extensibility**: Easy to add complex multi-step workflows for specific modules
- **Fallback**: Modules without custom workflows use the default implementation
- **Testing**: Individual workflows can be tested in isolation
- **Dependency Safety**: No race conditions, guaranteed dependency satisfaction
- **Concurrent Processing**: Independent modules run in parallel

