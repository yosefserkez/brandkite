import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class ImageryWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Imagery;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const imagerySchema = z.string().describe("Imagery style - photography/illustration direction");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: imagerySchema }),
      schemaName: 'BrandImagery',
      prompt: `Describe the imagery style (photography/illustration direction) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

