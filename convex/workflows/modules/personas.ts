import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class PersonasWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Personas;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: Array<{ name: string; description: string; characteristics?: string[] }> }> {
    const { companyDescription } = context;

    const personasSchema = z.array(z.object({
      name: z.string(),
      description: z.string(),
      characteristics: z.array(z.string()).optional(),
    })).describe("Target personas - 2-3 detailed customer profiles");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: personasSchema }),
      schemaName: 'BrandPersonas',
      prompt: `Create 2–3 target personas with names, descriptions, and key characteristics for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

