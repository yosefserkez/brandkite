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
	"You are an experienced brand typographer. Translate strategy into a cohesive typography system that is clear, practical to implement on the web, and rooted in accessibility guidelines. Write in natural language without marketing fluff.";
const TYPOGRAPHY_TEMPERATURE = 0.65;

export const typographySchema = z.object({
	overview: z
		.string()
		.describe(
			"Two to three sentences that explain how the typography reflects the brand personality and supports usability."
		),
	guidelines: z
		.array(
			z
				.string()
				.describe(
					"Concise implementation guidelines (e.g., pairing rules, accessibility reminders)."
				)
		)
		.min(2)
		.max(6),
	primaryFont: z.object({
		name: z.string(),
		summary: z
			.string()
			.describe(
				"Overview of the font's voice and why it fits the brand. Mention the literal token {company_name} instead of the actual brand name."
			),
		usage: z
			.string()
			.describe("Specific instructions for where to use the primary font."),
		pairing: z
			.string()
			.describe("How the primary font pairs with supporting typography."),
	}),
	headlineFont: z.object({
		name: z.string(),
		summary: z
			.string()
			.describe(
				"Overview of the expressive/display font and how it balances the system. Mention the literal token {company_name} instead of the actual brand name."
			),
		usage: z
			.string()
			.describe("Specific instructions for where to use the headline font."),
		pairing: z
			.string()
			.describe("How to mix the headline font with the primary font."),
	}),
	specimenCopy: z
		.string()
		.describe(
			"A short sentence that demonstrates the brand's tone with the primary font. Mention the literal token {company_name} instead of the actual brand name."
		),
});

export type BrandTypography = z.infer<typeof typographySchema>;

export const typographyValidator = v.object({
	overview: v.string(),
	guidelines: v.array(v.string()),
	primaryFont: v.object({
		name: v.string(),
		summary: v.string(),
		usage: v.string(),
		pairing: v.string(),
	}),
	headlineFont: v.object({
		name: v.string(),
		summary: v.string(),
		usage: v.string(),
		pairing: v.string(),
	}),
	specimenCopy: v.string(),
});

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceBrandNameToken = (
	value: string,
	companyName?: string | null
): string => {
	const trimmed = value.trim();
	if (!companyName) {
		return trimmed;
	}
	const pattern = new RegExp(`\\b${escapeRegExp(companyName)}\\b`, "gi");
	return trimmed.replace(pattern, "{company_name}");
};

const normalizeTypography = (
	data: BrandTypography,
	companyName?: string | null
): BrandTypography => ({
	overview: replaceBrandNameToken(data.overview, companyName),
	guidelines: data.guidelines.map((line) =>
		replaceBrandNameToken(line, companyName)
	),
	primaryFont: {
		name: data.primaryFont.name.trim(),
		summary: replaceBrandNameToken(data.primaryFont.summary, companyName),
		usage: replaceBrandNameToken(data.primaryFont.usage, companyName),
		pairing: replaceBrandNameToken(data.primaryFont.pairing, companyName),
	},
	headlineFont: {
		name: data.headlineFont.name.trim(),
		summary: replaceBrandNameToken(data.headlineFont.summary, companyName),
		usage: replaceBrandNameToken(data.headlineFont.usage, companyName),
		pairing: replaceBrandNameToken(data.headlineFont.pairing, companyName),
	},
	specimenCopy: replaceBrandNameToken(data.specimenCopy, companyName),
});

const buildTypographyPrompt = (params: {
	brandContext: BrandContext;
	companyName?: string | null;
}): string => {
	const { brandContext, companyName } = params;
	const inspirations = brandContext.brand.inspirations
		.map(
			(inspiration) =>
				`- ${inspiration.name}: ${inspiration.summary} (${inspiration.url})`
		)
		.join("\n");

	const docSummaries = brandContext.documents.length
		? brandContext.documents.map((doc) => `- ${doc.summary}`).join("\n")
		: "";

	return [
		`Brand name for context: ${companyName ?? "Unnamed brand"}`,
		"Always use the literal token {company_name} instead of the actual brand name in textual fields.",
		"",
		"Brand overview:",
		`- Summary: ${brandContext.summary}`,
		`- Industry: ${brandContext.industry ?? "Unspecified industry"}`,
		`- Audience: ${brandContext.customer.summary}`,
		`- Product: ${brandContext.product.summary}`,
		`- Market: ${brandContext.market.summary}`,
		`- Brand voice: ${brandContext.brand.summary}`,
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
		"Design a typography system that fits this strategy.",
		"Follow these constraints:",
		"- Primary font should be a widely available, web-safe or Google Fonts family that supports long-form reading.",
		"- Headline font can be more expressive but must remain legible in web interfaces.",
		"- Guidelines should cover implementation, accessibility, and pairing advice.",
		"- Specimen copy should be one sentence under 15 words and include the {company_name} token exactly once.",
		"",
		"Respond by filling the provided structured schema only.",
	].join("\n");
};

export const generateBrandTypography = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ typography: BrandTypography }> => {
		const prompt = buildTypographyPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: typographySchema }),
			prompt,
			temperature: TYPOGRAPHY_TEMPERATURE,
		});

		return {
			typography: normalizeTypography(
				object.value,
				args.companyName ?? undefined
			),
		};
	},
});

export const typographyWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandTypography> => {
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
				type: BrandModuleTypes.Typography,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { typography } = await ctx.runAction(
			internal.modules.typography.generateBrandTypography,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: typography,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return typography;
	},
});
