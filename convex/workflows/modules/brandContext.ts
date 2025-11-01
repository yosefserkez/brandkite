import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class BrandContextWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.BrandContext;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      summary: string;
      inspirations?: Array<{
        name: string;
        websiteUrl: string;
        imageUrl: string;
        summary: string;
      }>;
    }
  }> {
    const { companyDescription, existingModules, inputContent } = context;

    // Build context from provided content or existing modules
    const contextString = inputContent || companyDescription;

    const brandSchema = z.object({
      summary: z.string().describe("Summary of brand identity and vision"),
      inspirations: z.array(
        z.object({
          name: z.string().describe("Inspiration name"),
          websiteUrl: z.string().describe("Inspiration website URL. Use empty string \"\" if not available."),
          imageUrl: z.string().describe("Inspiration image URL. Use empty string \"\" if not available."),
          summary: z.string().describe("Brief summary of the inspiration"),
        })
      ).optional().describe("Brand inspirations if mentioned. Return empty array [] if none mentioned."),
    });

    const { object: brandResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure brand information from the provided content. Always provide all required fields. Use reasonable defaults or placeholders if information is missing. Arrays can be empty if no items are mentioned. URLs and imageUrl fields can be empty strings if not available.',
      schema: z.object({ value: brandSchema }),
      schemaName: 'BrandContext',
      prompt: contextString.trim() 
        ? `Extract and structure brand information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields. Use empty arrays [] if no items are mentioned. Use empty strings "" for URLs if not available.`
        : `Generate a basic brand structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const brand = brandResult.value;

    return {
      data: {
        summary: brand.summary || "",
        inspirations: brand.inspirations || [],
      },
    };
  }
}

