import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class NameWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Name; 
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: { name: string } }> {
    const { companyDescription, existingModules, ctx } = context;

    const companySummary = `
    ${companyDescription}
    ${existingModules['tagline']}
    ${existingModules['mission']}
    ${existingModules['vision']}
    ${existingModules['values']}
    ${existingModules['purpose']}
    ${existingModules['personas']}
    ${existingModules['positioning']}
    ${existingModules['tone']}
    ${existingModules['promise']}
    ${existingModules['narratives']}
    ${existingModules['personality']}
    ${existingModules['differentiators']}
    `;

    const nameSchema = z.object({
      name: z.string().describe("The name of the company"),
    }).describe("Company Name - a brand asset describing the name of the company");
    
    const { object: nameResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand designer specializing in company names. Create a creative, distinctive company name from the company summary.',
      schema: z.object({ value: nameSchema }),
      prompt: `Generate a creative, distinctive name for "${companySummary}".`,
      temperature: 0.8,
    });

    const name = nameResult.value;

    return {
      data: name,
    };
  }
}

