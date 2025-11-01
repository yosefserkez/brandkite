import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class MarketWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Market;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      summary: string;
      competitors: Array<{
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

    const marketSchema = z.object({
      summary: z.string().describe("Summary of the market and industry. If not mentioned, provide a general industry description."),
      competitors: z.array(
        z.object({
          name: z.string().describe("Competitor name. Use 'Unknown Competitor' if only inferred."),
          websiteUrl: z.string().describe("Competitor website URL. Use empty string \"\" if not available."),
          imageUrl: z.string().describe("Competitor logo/image URL. Use empty string \"\" if not available."),
          summary: z.string().describe("Brief summary of the competitor. Use 'A competitor in the market' if details unknown."),
        })
      ).describe("Competitors mentioned or inferred. Return empty array [] if none mentioned."),
    });

    const { object: marketResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure market information from the provided content. Always provide all required fields. Use reasonable defaults or placeholders if information is missing. Arrays can be empty if no items are mentioned. URLs and imageUrl fields can be empty strings if not available.',
      schema: z.object({ value: marketSchema }),
      schemaName: 'Market',
      prompt: contextString.trim() 
        ? `Extract and structure market information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields. Use empty arrays [] if no items are mentioned. Use empty strings "" for URLs if not available.`
        : `Generate a basic market structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const market = marketResult.value;

    return {
      data: {
        summary: market.summary || "The target market and industry",
        competitors: market.competitors?.map(c => ({
          name: c.name || "Unknown Competitor",
          websiteUrl: c.websiteUrl || "",
          imageUrl: c.imageUrl || "",
          summary: c.summary || "",
        })) || [],
      },
    };
  }
}

