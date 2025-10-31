import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class VoiceWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Voice;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const voiceSchema = z.string().describe("Brand voice - personality in communication");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: voiceSchema }),
      schemaName: 'BrandVoice',
      prompt: `Define the brand voice for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

