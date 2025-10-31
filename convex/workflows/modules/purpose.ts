import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class PurposeWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Purpose;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const purposeSchema = z.string().describe("Brand purpose - why we exist");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: purposeSchema }),
      schemaName: 'BrandPurpose',
      prompt: `Explain the brand purpose (why we exist) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

