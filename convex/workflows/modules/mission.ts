import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class MissionWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Mission;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const missionSchema = z.string().describe("Mission statement - what we do");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: missionSchema }),
      schemaName: 'BrandMission',
      prompt: `Write a concise mission statement (what we do) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

