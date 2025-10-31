import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class ValuesWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Values;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string[] }> {
    const { companyDescription } = context;

    const valuesSchema = z.array(z.string()).describe("Core values - 3-5 key principles");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: valuesSchema }),
      schemaName: 'BrandValues',
      prompt: `List 3–5 core values for this brand: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

