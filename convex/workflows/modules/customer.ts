import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class CustomerWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Customer;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      description: string;
      location: string;
      painPoints: string[];
      demographics?: string;
    }
  }> {
    const { companyDescription, existingModules, inputContent } = context;

    // Build context from provided content or existing modules
    const contextString = inputContent || companyDescription;

    const customerSchema = z.object({
      description: z.string().describe("Description of the target customer. If not mentioned, provide a general description based on the product/service."),
      location: z.string().describe("Geographic location or market of the customer. Use 'Global' or 'Various markets' if not specified."),
      painPoints: z.array(z.string()).describe("Main pain points the customer faces. Return empty array [] if none mentioned."),
      demographics: z.string().optional().describe("Demographic information if available"),
    });

    const { object: customerResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure customer information from the provided content. Always provide all required fields. Use reasonable defaults or placeholders if information is missing. Arrays can be empty if no items are mentioned.',
      schema: z.object({ value: customerSchema }),
      schemaName: 'Customer',
      prompt: contextString.trim() 
        ? `Extract and structure customer information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields. Use empty arrays [] if no items are mentioned.`
        : `Generate a basic customer structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const customer = customerResult.value;

    return {
      data: {
        description: customer.description || "Target customers for the business",
        location: customer.location || "Global",
        painPoints: customer.painPoints || [],
        demographics: customer.demographics,
      },
    };
  }
}

