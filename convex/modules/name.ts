import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import type { Infer } from "convex/values";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

// Reusable Convex validators
export const nameValidator = v.object({
	name: v.string(),
	reasoning: v.string(),
	alternatives: v.array(
		v.object({
			name: v.string(),
			reasoning: v.string(),
		})
	),
});

// Zod schema for AI generation (keeping this for generateObject compatibility)
export const nameSchema = z.object({
	name: z
		.string()
		.describe(
			"The primary recommended brand name. Should be memorable, distinctive, and aligned with the brand's values and positioning."
		),
	reasoning: z
		.string()
		.describe(
			"Detailed explanation of why this name was chosen, including how it reflects the brand context, target audience, and market positioning."
		),
	alternatives: z
		.array(
			z.object({
				name: z
					.string()
					.describe("An alternative brand name option that also fits well"),
				reasoning: z
					.string()
					.describe("Brief explanation of this alternative name's strengths"),
			})
		)
		.describe(
			"3-5 alternative name options with their reasoning, ranked by recommendation strength"
		),
});

export type Name = Infer<typeof nameValidator>;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const generateName = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
	},
	handler: async (_ctx, args): Promise<{ name: Name }> => {
		const brandContextSummary = `
Brand Summary: ${args.brandContext.summary}

Product: ${args.brandContext.product.summary}

Market: ${args.brandContext.market.summary}

Customer: ${args.brandContext.customer.summary}

Brand Identity: ${args.brandContext.brand.summary}

Business Model: ${args.brandContext.business.summary}
`;

		const { object } = await generateObject({
			model: openrouter.chat("google/gemini-2.5-flash-lite-preview-09-2025"),
			system:
				"You are a creative brand naming expert. Generate compelling, memorable brand names based on the provided brand context. Consider linguistics, market appeal, memorability, and brand alignment.",
			schema: z.object({ value: nameSchema }),
			prompt: `Generate a compelling brand name and alternatives based on this brand context:\n\n${brandContextSummary}`,
			temperature: 0.9,
		});

		return {
			name: object.value,
		};
	},
});

export const nameWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<{ name: Name }> => {
		// Wait for brandContext to be available

		const brandContextModule = await ctx.runQuery(
			internal.brandModules.getPublishedModules,
			{
				companyId: args.companyId,
				types: [BrandModuleTypes.BrandContext],
			}
		);

		// TODO:If brandContext doesn't exist, wait

		const brandContext = brandContextModule[BrandModuleTypes.BrandContext]
			?.data as BrandContext;

		if (!brandContext) {
			throw new Error("Brand context data is invalid");
		}

		// create module with generation status in progress
		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Name,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { name } = await ctx.runAction(internal.modules.name.generateName, {
			companyId: args.companyId,
			brandContext,
		});

		// Save the name as a module
		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: name,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return { name };
	},
});
