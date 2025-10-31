import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class ColorsWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Colors;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      primary: { name: string; hex: string };
      secondary: { name: string; hex: string };
      accent?: { name: string; hex: string };
      additional?: Array<{ name: string; hex: string }>;
    }
  }> {
    const { companyDescription } = context;

    const colorsSchema = z.object({
      primary: z.object({
        name: z.string(),
        hex: z.string(),
      }),
      secondary: z.object({
        name: z.string(),
        hex: z.string(),
      }),
      accent: z.object({
        name: z.string(),
        hex: z.string(),
      }).optional(),
      additional: z.array(z.object({
        name: z.string(),
        hex: z.string(),
      })).optional(),
    }).describe("Color palette - primary, secondary, accent colors with hex codes");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: colorsSchema }),
      schemaName: 'BrandColors',
      prompt: `Propose a color palette (primary, secondary, optional accent, optional additional) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

