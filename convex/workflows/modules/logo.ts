import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class LogoWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Logos;

  // Optional: Declare dependencies if you want to wait for brandName
  // For now, we'll work with companyDescription as fallback
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      direction: string;
      description: string;
      concept: string;
    }
  }> {
    const { companyDescription, existingModules, ctx } = context;

    // Step 1: Get required information
    const brandName = existingModules['brandName'];
    if (!brandName && !companyDescription) {
      throw new Error('Logo generation requires brand name or company description');
    }

    const logoConceptSchema = z.object({
      direction: z.string().describe("The visual approach (e.g., 'Minimalist Geometric', 'Hand-drawn Organic', 'Tech-Futuristic')"),
      description: z.string().describe("What the logo represents and communicates"),
      concept: z.string().describe("Specific visual details and elements"),  
    }).describe("Logo - a single logo concept with a direction, description, and concept");
    
    // Step 2: Generate logo concepts with one model
    const { object: conceptsResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand designer specializing in logo concepts. Create creative, distinctive logo directions.',
      schema: z.object({ value: logoConceptSchema }),
      prompt: `Generate a single distinct logo concept direction for "${brandName || companyDescription}". 
        Each concept should include:
        - direction: The visual approach (e.g., "Minimalist Geometric", "Hand-drawn Organic", "Tech-Futuristic")
        - description: What the logo represents and communicates
        - concept: Specific visual details and elements
        Consider the brand's personality and make each concept unique and memorable.`,
      temperature: 0.8,
    });

    const concepts = conceptsResult.value;

    // TODO: Future steps for logo workflow:
    // Step 3: For the best idea, generate an image using DALL-E or similar
    // Step 4: Convert image to SVG using vectorization
    
    // For now, return just the concepts (matching the schema)
    return {
      data: concepts,
    };
  }
}

