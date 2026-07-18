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
	"You are a brand voice strategist crafting tone of voice guides that feel human, empathetic, and practical. Translate strategy into clear tone principles with tangible examples drawn from the provided context. Use the literal token {company_name} whenever you reference the brand in the story. Never output the actual brand name.";

const TONE_EXAMPLE_COUNT = 3;

const toneExampleSchema = z.object({
	title: z
		.string()
		.describe(
			"Short, benefit-led headline (3-6 words) that captures a tone pillar in an inviting way."
		),
	description: z
		.string()
		.describe(
			"1-2 sentence illustration of how the tone sounds in practice. Reference customer reality and the brand's guidance."
		),
	context: z
		.string()
		.describe(
			"Specific scenario where this tone shows up (e.g. product messaging, support reply, social caption)."
		),
});

export const toneSchema = z.object({
	summary: z
		.string()
		.describe(
			"2-3 sentence overview describing how {company_name} should sound. Highlight emotional feel, credibility, and inclusivity."
		),
	examples: z
		.array(toneExampleSchema)
		.length(TONE_EXAMPLE_COUNT)
		.describe(
			"Exactly three tone applications with headline, scenario context, and descriptive guidance."
		),
});

export type BrandTone = z.infer<typeof toneSchema>;
export type BrandToneExample = z.infer<typeof toneExampleSchema>;

export const toneValidator = v.object({
	summary: v.string(),
	examples: v.array(
		v.object({
			title: v.string(),
			description: v.string(),
			context: v.string(),
		})
	),
});

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type BuildTonePromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
};

const buildTonePrompt = (args: BuildTonePromptArgs): string => {
	const { brandContext, companyName } = args;

	const documentInsights = brandContext.documents
		.map((doc) => `- ${doc.summary}`)
		.join("\n");

	const inspirationHighlights = brandContext.brand.inspirations
		.map((inspiration) => `- ${inspiration.name}: ${inspiration.summary}`)
		.join("\n");

	return [
		`Brand name: ${companyName ?? "Unnamed brand"}`,
		"Use the literal token {company_name} whenever you reference the brand in the story. Never output the actual brand name.",
		"",
		"Brand essence overview:",
		`- Summary: ${brandContext.summary}`,
		`- Industry: ${brandContext.industry ?? "Unspecified"}`,
		`- Customer voice: ${brandContext.customer.summary}`,
		`- Product posture: ${brandContext.product.summary}`,
		`- Market reality: ${brandContext.market.summary}`,
		`- Brand voice cues: ${brandContext.brand.summary}`,
		`- Business grounding: ${brandContext.business.summary}`,
		brandContext.team
			? `- Team presence: ${brandContext.team.summary ?? "Team details available"}`
			: "- Team presence: Not described",
		documentInsights
			? ["", "Supporting document notes:", documentInsights].join("\n")
			: "",
		inspirationHighlights
			? [
					"",
					"Inspiration brands to nod toward (not copy):",
					inspirationHighlights,
				].join("\n")
			: "",
		"",
		"Deliver a tone of voice guide that:",
		"- Gives an inviting summary capturing friendliness, credibility, inclusivity, and a hint of playfulness.",
		"- Provides exactly three examples. Each example needs:",
		"  * A headline that sounds like a benefit-focused tone pillar.",
		"  * A short scenario label describing where this tone shows up.",
		"  * A concise description showing how copy should feel in that moment.",
		"- Reference customer realities and the lived context of Boonton (if relevant) without making up facts.",
		"- Keep language plain, human, and free from jargon.",
		"",
		"Respond strictly in JSON satisfying the provided schema.",
	].join("\n");
};

const normalizeTone = (
	tone: BrandTone,
	companyName?: string | null
): BrandTone => {
	const summary = tone.summary.trim();
	const examples = tone.examples.map((example) => ({
		title: example.title.trim(),
		description: example.description.trim(),
		context: example.context.trim(),
	}));

	if (!companyName) {
		return { summary, examples };
	}

	const escapedCompanyName = escapeRegExp(companyName);
	const namePattern = new RegExp(`\\b${escapedCompanyName}\\b`, "gi");

	return {
		summary: summary.replace(namePattern, "{company_name}"),
		examples: examples.map((example) => ({
			...example,
			title: example.title.replace(namePattern, "{company_name}"),
			description: example.description.replace(namePattern, "{company_name}"),
			context: example.context.replace(namePattern, "{company_name}"),
		})),
	};
};

export const generateBrandTone = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ tone: BrandTone }> => {
		const prompt = buildTonePrompt({
			brandContext: args.brandContext,
			companyName: args.companyName ?? null,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: toneSchema }),
			prompt,
			temperature: 0.65,
		});

		const tone = normalizeTone(object.value, args.companyName ?? null);
		return { tone };
	},
});

export const toneWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandTone> => {
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
				type: BrandModuleTypes.Tone,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { tone } = await ctx.runAction(
			internal.modules.tone.generateBrandTone,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: tone,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return tone;
	},
});
