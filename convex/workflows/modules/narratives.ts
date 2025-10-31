import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class NarrativesWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Narratives;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string[] }> {
    const { companyDescription } = context;

    const narrativesSchema = z.array(z.string()).describe("Key narratives - 3-4 story themes");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: narrativesSchema }),
      schemaName: 'BrandNarratives',
      prompt: `List 3–4 key story narratives/themes for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

