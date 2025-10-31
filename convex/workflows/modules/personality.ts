import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class PersonalityWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Personality;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const personalitySchema = z.string().describe("Brand personality - human characteristics");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: personalitySchema }),
      schemaName: 'BrandPersonality',
      prompt: `Describe the human-like brand personality for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

