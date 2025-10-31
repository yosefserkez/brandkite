import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext, WorkflowDependency } from '../types';
import { BrandModuleTypes } from '.';

export class StoryWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Story;
  dependencies: WorkflowDependency[] = [
    { moduleType: BrandModuleTypes.Name, requireSuccess: true },
    { moduleType: BrandModuleTypes.Tagline, requireSuccess: true },
    { moduleType: BrandModuleTypes.Vision, requireSuccess: true },
    { moduleType: BrandModuleTypes.Values, requireSuccess: true },
    { moduleType: BrandModuleTypes.Purpose, requireSuccess: true },
    { moduleType: BrandModuleTypes.Personas, requireSuccess: true },
  ];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const storySchema = z.string().describe("Brand story - compelling narrative");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: storySchema }),
      schemaName: 'BrandStory',
      prompt: `Write a concise brand story for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

