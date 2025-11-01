import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { BrandModuleWorkflow, WorkflowContext } from '../types';
import { BrandModuleTypes } from '.';

export class TeamWorkflow implements BrandModuleWorkflow {
  moduleType = BrandModuleTypes.Team;
  dependencies: [] = [];

  async generate(context: WorkflowContext): Promise<{ 
    data: {
      summary: string;
      members: Array<{
        name: string;
        role: string;
        summary: string;
        imageUrl: string;
      }>;
    }
  }> {
    const { companyDescription, existingModules, inputContent } = context;

    // Build context from provided content or existing modules
    const contextString = inputContent || companyDescription;

    const teamSchema = z.object({
      summary: z.string().describe("Summary of the team, their mission, and structure. If not mentioned, provide a general placeholder like 'A dedicated team focused on delivering value to customers'."),
      members: z.array(
        z.object({
          name: z.optional(z.string()).describe("Team member name. Use empty string if not mentioned."),
          role: z.optional(z.string()).describe("Team member role. Use empty string if not mentioned."),
          summary: z.optional(z.string()).describe("Brief summary of the team member. Use empty string if not mentioned."),
          imageUrl: z.optional(z.string()).describe("URL to team member image. Use empty string if not available."),
        })
      ).describe("Key team members if mentioned. Return empty array [] if none mentioned."),
    });

    const { object: teamResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a business analyst. Extract and structure team information from the provided content. Always provide all required fields. Do not make up information if not provided.',
      schema: z.object({ value: teamSchema }),
      schemaName: 'Team',
      prompt: contextString.trim() 
        ? `Extract and structure team information from the following content:\n\n${contextString}\n\nIMPORTANT: Always provide all required fields. Use empty arrays [] if no items are mentioned. Use empty strings "" for URLs if not available.`
        : `Generate a basic team structure. Since no content was provided, use reasonable placeholders for all fields.`,
      temperature: 0.8,
    });

    const team = teamResult.value;

    return {
      data: {
        summary: team.summary || "A dedicated team focused on delivering value to customers",
        members: team.members?.map(m => ({
          name: m.name || "N/A",
          role: m.role || "Team Member",
          summary: m.summary || "Team member",
          imageUrl: m.imageUrl || "",
        })) || [],
      },
    };
  }
}

