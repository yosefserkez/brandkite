import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const MODEL_NAME = "x-ai/grok-4.3";
const SYSTEM_PROMPT =
	"You are an expert brand copywriter. You craft crisp, evocative taglines that express a brand's core promise in 5-10 vivid words. Use the literal token {company_name} whenever you reference the brand. Never output the actual brand name.";

export const taglineSchema = z.object({
	tagline: z
		.string()
		.describe(
			"Primary brand tagline, 5-10 words, declarative or evocative. Use {company_name} placeholder for the brand name."
		),
});

export type BrandTagline = z.infer<typeof taglineSchema>;

export const taglineValidator = v.object({
	tagline: v.string(),
});

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

type BuildPromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
};

const buildTaglinePrompt = ({
	brandContext,
	companyName,
}: BuildPromptArgs): string => {
	const customerTension = brandContext.customer.summary;
	const productPromise = brandContext.product.summary;
	const marketDifferentiator = brandContext.market.summary;
	const brandVoice = brandContext.brand.summary;

	const inspirationLines = brandContext.brand.inspirations
		.map(
			(inspiration) =>
				`- ${inspiration.name}: ${inspiration.summary} (Source: ${inspiration.url})`
		)
		.join("\n");

	return [
		`Brand name for context: ${companyName ?? "Unnamed brand"}`,
		"Use the literal token {company_name}. Do not output the actual brand name.",
		"",
		"Customer tension (what they feel today):",
		customerTension,
		"",
		"Product promise (what {company_name} delivers):",
		productPromise,
		"",
		"Market differentiation (how we stand apart):",
		marketDifferentiator,
		"",
		"Brand voice and personality:",
		brandVoice,
		"",
		inspirationLines
			? ["Inspirational references to nod toward:", inspirationLines].join("\n")
			: "",
		"",
		"Write exactly one tagline that:",
		"- Runs 5-10 words.",
		"- Sounds distinctive in this category.",
		"- Balances emotion with clarity.",
		"- Hint at the transformation the customer feels.",
		"- Can stand alone on a website hero.",
		"",
		"Respond strictly in JSON matching the provided schema.",
	].join("\n");
};

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTagline = (
	tagline: BrandTagline,
	companyName?: string | null
): BrandTagline => {
	const trimmed = tagline.tagline.trim();

	if (!companyName) {
		return { tagline: trimmed };
	}

	const escapedCompanyName = escapeRegExp(companyName);
	const namePattern = new RegExp(`\\b${escapedCompanyName}\\b`, "gi");

	return {
		tagline: trimmed.replace(namePattern, "{company_name}"),
	};
};

export const generateBrandTagline = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ tagline: BrandTagline }> => {
		const prompt = buildTaglinePrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? null,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: taglineSchema }),
			prompt,
			temperature: 0.7,
		});

		return {
			tagline: normalizeTagline(object.value, args.companyName ?? null),
		};
	},
});

export const taglineWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandTagline> => {
		const brandContextDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.BrandContext,
			})
		)?.data as BrandContext | null;

		if (!brandContextDoc) {
			throw new Error("Brand context data is invalid");
		}

		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Tagline,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { tagline } = await ctx.runAction(
			internal.modules.tagline.generateBrandTagline,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: tagline,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return tagline;
	},
});

