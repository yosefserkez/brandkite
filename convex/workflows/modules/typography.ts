import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class TypographyWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Typography;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      primary: { font: string; description?: string };
      secondary: { font: string; description?: string };
    }
  }> {
    const { companyDescription } = context;

    const typographySchema = z.object({
      primary: z.object({
        font: z.string(),
        description: z.string().optional(),
      }),
      secondary: z.object({
        font: z.string(),
        description: z.string().optional(),
      }),
    }).describe("Typography - primary and secondary font recommendations");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: typographySchema }),
      schemaName: 'BrandTypography',
      prompt: `Recommend primary and secondary typography (fonts) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

