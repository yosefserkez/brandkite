import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class PositioningWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Positioning;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const positioningSchema = z.string().describe("Unique market position");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: positioningSchema }),
      schemaName: 'BrandPositioning',
      prompt: `Write a clear brand positioning statement for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

