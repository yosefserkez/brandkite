import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class ToneWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Tone;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const toneSchema = z.string().describe("Tone of voice - personality traits");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: toneSchema }),
      schemaName: 'BrandTone',
      prompt: `Define the tone of voice (personality traits) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

