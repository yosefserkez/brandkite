import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class DifferentiatorsWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Differentiators;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string[] }> {
    const { companyDescription } = context;

    const differentiatorsSchema = z.array(z.string()).describe("Key differentiators - what sets us apart");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: differentiatorsSchema }),
      schemaName: 'BrandDifferentiators',
      prompt: `List key differentiators that set this brand apart: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

