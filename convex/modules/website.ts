import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { copyChecks } from "../lib/design/checks";
import { brandKitBlock, distinctivenessBlock } from "../lib/design/context";
import { generateChecked } from "../lib/design/generate";
import { textModel } from "../lib/design/models";
import {
	COPY_CRAFT,
	composeSystem,
	DISTINCTIVE_VOICE,
	MESSAGE_HIERARCHY,
	NO_FABRICATION,
} from "../lib/design/skills";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const SYSTEM_PROMPT = composeSystem(
	"You are a conversion copywriter writing a landing page in the brand's voice. Write specific, benefit-led copy that reads like a real product site — clear, confident, and human.",
	COPY_CRAFT,
	NO_FABRICATION,
	DISTINCTIVE_VOICE,
	MESSAGE_HIERARCHY
);
const TEMPERATURE = 0.75;
const FEATURE_COUNT = 3;

const featureSchema = z.object({
	title: z.string().describe("A short benefit-led heading (3-6 words)."),
	description: z
		.string()
		.describe("1-2 sentences explaining the benefit concretely."),
});

export const websiteSchema = z.object({
	hero: z.object({
		headline: z
			.string()
			.describe(
				"The main hero headline — punchy, outcome-focused, <= 9 words."
			),
		subheadline: z
			.string()
			.describe("One supporting sentence (~12-20 words) that adds specifics."),
	}),
	features: z
		.array(featureSchema)
		.length(FEATURE_COUNT)
		.describe("Exactly three benefit sections."),
	cta: z.object({
		headline: z.string().describe("A closing CTA headline, one short line."),
		buttonText: z.string().describe("Button label, 2-4 words."),
	}),
});

export type BrandWebsite = z.infer<typeof websiteSchema>;

export const websiteValidator = v.object({
	hero: v.object({ headline: v.string(), subheadline: v.string() }),
	features: v.array(v.object({ title: v.string(), description: v.string() })),
	cta: v.object({ headline: v.string(), buttonText: v.string() }),
});

const STYLE_GUIDANCE: Record<string, string> = {
	benefit: "Style: benefit-led. Lead with outcomes the customer gets.",
	minimal: "Style: minimal and calm. Short, confident, lots of restraint.",
	bold: "Style: bold and punchy. Strong opinions, short lines, high energy.",
};

type BuildWebsitePromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
	tagline?: string | null;
	mission?: string | null;
	style?: string;
};

const buildWebsitePrompt = ({
	brandContext,
	companyName,
	tagline,
	mission,
	style = "benefit",
}: BuildWebsitePromptArgs): string => {
	const name = companyName ?? "the brand";
	return [
		`Write landing page copy for ${name}.`,
		STYLE_GUIDANCE[style] ?? STYLE_GUIDANCE.benefit,
		"",
		"Use the actual brand name naturally; do not use placeholder tokens.",
		"",
		brandKitBlock({ brandContext, tagline, mission }),
		"",
		distinctivenessBlock(brandContext),
		"",
		"Produce:",
		"- hero: a headline + one supporting subheadline.",
		"  The headline must be concrete and could only belong to this brand — never a formula ('X made simple', 'The Y platform', 'Complete X from one Y'). The subheadline names who it's for and what they walk away with.",
		"- features: exactly 3 benefit sections (title + description), each a distinct value.",
		"  Each description names a concrete mechanism or outcome; no abstract nouns doing the work.",
		"- cta: a closing headline + button label.",
		"  The CTA headline is a direct invitation (<= 6 words) grounded in the product's promise, not a slogan.",
		"- Specific and grounded. No buzzwords, no clichés, no invented numbers or testimonials.",
		"",
		"Respond with JSON satisfying the provided schema.",
	].join("\n");
};

export const generateWebsite = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
		tagline: v.optional(v.string()),
		mission: v.optional(v.string()),
		style: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ website: BrandWebsite }> => {
		const prompt = buildWebsitePrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
			tagline: args.tagline ?? undefined,
			mission: args.mission ?? undefined,
			style: args.style,
		});

		const website = await generateChecked({
			model: textModel(),
			system: SYSTEM_PROMPT,
			prompt,
			temperature: TEMPERATURE,
			schema: websiteSchema,
			check: (value) => copyChecks(value, prompt),
			label: "website",
		});

		return { website };
	},
});

export const websiteWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandWebsite> => {
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

		const options =
			(args as { options?: Record<string, string> }).options ?? {};

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Website,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { website } = await ctx.runAction(
			internal.modules.website.generateWebsite,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
				tagline: taglineDoc?.tagline ?? undefined,
				mission: missionDoc?.mission ?? undefined,
				style: options.style,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: website,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return website;
	},
});
