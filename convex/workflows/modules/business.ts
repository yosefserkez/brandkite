import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class BusinessWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Business;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      summary: string;
      marketSize: string;
    }
  }> {
    const { companyDescription, existingModules, inputContent } = context;

    // Build context from provided content or existing modules
    const contextString = inputContent || companyDescription;

    const businessSchema = z.object({
      summary: z.string().describe("Summary of the business model and approach"),
      marketSize: z.string().describe("Market size or opportunity description"),
    });

    const { object: businessResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure business information from the provided content. Always provide all required fields. Use reasonable defaults or placeholders if information is missing.',
      schema: z.object({ value: businessSchema }),
      schemaName: 'Business',
      prompt: contextString.trim() 
        ? `Extract and structure business information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields.`
        : `Generate a basic business structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const business = businessResult.value;

    return {
      data: {
        summary: business.summary || "",
        marketSize: business.marketSize || "",
      },
    };
  }
}

