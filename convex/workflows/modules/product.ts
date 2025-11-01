import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class ProductWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Product;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      summary: string;
      features?: string[];
      differentiation?: string;
    }
  }> {
    const { companyDescription, existingModules, inputContent } = context;

    // Build context from provided content or existing modules
    const contextString = inputContent || companyDescription;

    const productSchema = z.object({
      summary: z.string().describe("Summary of the product or service. Extract from the content provided."),
      features: z.array(z.string()).optional().describe("Key features if mentioned. Return empty array [] if none."),
      differentiation: z.string().optional().describe("What makes this product unique"),
    });

    const { object: productResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure product information from the provided content. Always provide all required fields. Use reasonable defaults or placeholders if information is missing. Arrays can be empty if no items are mentioned.',
      schema: z.object({ value: productSchema }),
      schemaName: 'Product',
      prompt: contextString.trim() 
        ? `Extract and structure product information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields. Use empty arrays [] if no items are mentioned.`
        : `Generate a basic product structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const product = productResult.value;

    return {
      data: {
        summary: product.summary || "Product or service offering",
        features: product.features || [],
        differentiation: product.differentiation,
      },
    };
  }
}

