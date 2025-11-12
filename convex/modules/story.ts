import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const MODEL_NAME = "x-ai/grok-4-fast";
const SYSTEM_PROMPT =
	"You are a seasoned brand storyteller. Write vivid, emotionally compelling narratives that translate brand strategy into human stories. Ground every detail in the supplied context. Keep prose clear, evocative, and free of marketing buzzwords. Maintain authenticity and avoid exaggeration.";
const STORY_TEMPERATURE = 0.85;

export const storySchema = z.object({
	story: z
		.string()
		.describe(
			"Cohesive brand story written as multiple short paragraphs separated by blank lines. Lead with the customer's lived experience, weave in the founder or brand origin, and close with the transformation the brand enables."
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
}): string => {
	const { brandContext, companyName } = params;

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
		`Brand name: ${companyName ?? "Unnamed brand"}`,
		"",
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
		"Write a brand story that:",
		"- Opens with the emotional tension the customer feels today.",
		"- Introduces a relatable person (founder, customer, or team member) drawn from the context.",
		"- Explains the brand's solution in plain language.",
		"- Paints the moment of transformation and the community or experience surrounding it.",
		"- Closes with a grounded promise of what life feels like with the brand.",
		"",
		"Respond with the full story as plain text paragraphs only. Do not include additional headings, lists, or metadata.",
	].join("\n");
};

const normalizeStory = (story: BrandStory): BrandStory => ({
	story: story.story.trim(),
});

export const generateBrandStory = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ story: BrandStory }> => {
		const prompt = buildStoryPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: storySchema }),
			prompt,
			temperature: STORY_TEMPERATURE,
		});

		return { story: normalizeStory(object.value) };
	},
});

export const storyWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
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
