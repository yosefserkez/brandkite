import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class TaglineWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Tagline;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const taglineSchema = z.string().describe("Memorable tagline, 3-7 words");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: taglineSchema }),
      schemaName: 'BrandTagline',
      prompt: `Write a memorable 3–7 word tagline for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

