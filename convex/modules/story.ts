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
	"You are a brand strategist writing the brand story section of a brand kit. Write a tight, usable brand narrative a founder can paste onto an About page — concrete, confident, and specific. Ground every claim in the supplied context. No purple prose, no clichés, no marketing buzzwords (no 'revolutionize', 'seamless', 'empower', 'passion', 'journey'). Prefer plain, declarative sentences over flowery ones.";
const STORY_TEMPERATURE = 0.7;

export const storySchema = z.object({
	story: z
		.string()
		.describe(
			"A concise brand story of 2-3 short paragraphs (about 90-160 words total), separated by blank lines. Paragraph 1: the real problem the customer faces and why it matters. Paragraph 2: what the brand does about it and what makes it different. Paragraph 3 (optional, 1-2 sentences): the outcome for the customer. Usable as-is on an About page. No headings or lists."
		),
});

export type BrandStory = z.infer<typeof storySchema>;

export const storyValidator = v.object({
	story: v.string(),
});

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const buildStoryPrompt = (params: {
	brandContext: BrandContext;
	companyName?: string | null;
	tagline?: string | null;
	mission?: string | null;
}): string => {
	const { brandContext, companyName, tagline, mission } = params;

	const docSummaries = brandContext.documents.length
		? brandContext.documents.map((doc) => `- ${doc.summary}`).join("\n")
		: "";
	const inspirations = brandContext.brand.inspirations
		.map(
			(inspiration) =>
				`- ${inspiration.name}: ${inspiration.summary} (Source: ${inspiration.url})`
		)
		.join("\n");

	return [
		`Brand name for context: ${companyName ?? "Unnamed brand"}`,
		"Use the literal token {company_name} whenever you reference the brand in the story. Never output the actual brand name.",
		"",
		tagline ? `Stay consistent with the tagline: "${tagline}"` : "",
		mission ? `Stay consistent with the mission: "${mission}"` : "",
		tagline || mission ? "" : "",
		"Brand context:",
		`- Summary: ${brandContext.summary}`,
		`- Industry: ${brandContext.industry ?? "Unspecified"}`,
		`- Customer: ${brandContext.customer.summary}`,
		`- Product: ${brandContext.product.summary}`,
		`- Market: ${brandContext.market.summary}`,
		`- Brand voice: ${brandContext.brand.summary}`,
		`- Business model: ${brandContext.business.summary}`,
		brandContext.team
			? `- Team: ${brandContext.team.summary ?? "Team details available"}`
			: "- Team: Not described",
		docSummaries
			? ["", "Reference notes from source documents:", docSummaries].join("\n")
			: "",
		inspirations
			? ["", "Brand inspiration references to nod toward:", inspirations].join(
					"\n"
				)
			: "",
		"",
		"Write the brand story:",
		"- 2-3 short paragraphs, ~90-160 words total. Every sentence earns its place.",
		"- Paragraph 1: the concrete problem this customer faces today and why it matters.",
		"- Paragraph 2: what the brand does about it, in plain language, and the one thing that makes it different.",
		"- Optional final 1-2 sentences: the tangible outcome for the customer.",
		"- Specific and grounded, not abstract. No buzzwords, no clichés, no hype.",
		"",
		"Respond with the story as plain text paragraphs only. No headings, lists, or metadata.",
	].join("\n");
};

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeStory = (
	story: BrandStory,
	companyName?: string | null
): BrandStory => {
	const trimmedStory = story.story.trim();

	if (!companyName) {
		return { story: trimmedStory };
	}

	const escapedCompanyName = escapeRegExp(companyName);
	const namePattern = new RegExp(`\\b${escapedCompanyName}\\b`, "gi");

	return {
		story: trimmedStory.replace(namePattern, "{company_name}"),
	};
};

export const generateBrandStory = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
		tagline: v.optional(v.string()),
		mission: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ story: BrandStory }> => {
		const prompt = buildStoryPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
			tagline: args.tagline ?? undefined,
			mission: args.mission ?? undefined,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: storySchema }),
			prompt,
			temperature: STORY_TEMPERATURE,
		});

		return {
			story: normalizeStory(object.value, args.companyName ?? undefined),
		};
	},
});

export const storyWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandStory> => {
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

		const taglineDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.Tagline,
			})
		)?.data as { tagline?: string } | null;
		const missionDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.Mission,
			})
		)?.data as { mission?: string } | null;

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Story,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { story } = await ctx.runAction(
			internal.modules.story.generateBrandStory,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
				tagline: taglineDoc?.tagline ?? undefined,
				mission: missionDoc?.mission ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: story,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return story;
	},
});
