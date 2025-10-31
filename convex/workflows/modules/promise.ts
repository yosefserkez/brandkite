import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class PromiseWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Promise;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ data: string }> {
    const { companyDescription } = context;

    const promiseSchema = z.string().describe("Brand promise - what customers can expect");
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a brand strategist and designer. Generate comprehensive, professional brand content.',
      schema: z.object({ value: promiseSchema }),
      schemaName: 'BrandPromise',
      prompt: `Write the brand promise (what customers can expect) for: "${companyDescription}"`,
      temperature: 0.7,
    });

    return { data: object.value };
  }
}

