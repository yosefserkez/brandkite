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
	NO_FABRICATION,
} from "../lib/design/skills";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const SYSTEM_PROMPT = composeSystem(
	"You are a senior performance-marketing copywriter. Write sharp, specific ad copy that sounds like the brand and drives action. Lead with the customer's problem or desire, not the product.",
	COPY_CRAFT,
	NO_FABRICATION,
	DISTINCTIVE_VOICE
);
const TEMPERATURE = 0.8;
const AD_COUNT = 3;

const adSchema = z.object({
	angle: z
		.string()
		.describe(
			"Short 1-3 word label for this ad's angle (e.g. 'Problem-led', 'Social proof', 'Time saved')."
		),
	headline: z
		.string()
		.describe("Scroll-stopping headline, at most ~8 words. No period."),
	primaryText: z
		.string()
		.describe(
			"The ad body: 1-2 short sentences (about 15-40 words) that make the case and lead to the CTA."
		),
	cta: z
		.string()
		.describe("Call to action button text, 2-4 words (e.g. 'Start free')."),
});

export const marketingSchema = z.object({
	valueProp: z
		.string()
		.describe(
			"One punchy sentence (~12-18 words) stating the core value the brand delivers — usable as a headline or meta description."
		),
	ads: z
		.array(adSchema)
		.length(AD_COUNT)
		.describe(
			"Exactly three distinct ad variants, each with a different angle."
		),
});

export type BrandMarketing = z.infer<typeof marketingSchema>;

export const marketingValidator = v.object({
	valueProp: v.string(),
	ads: v.array(
		v.object({
			angle: v.string(),
			headline: v.string(),
			primaryText: v.string(),
			cta: v.string(),
		})
	),
});

const PLATFORM_GUIDANCE: Record<string, string> = {
	generic: "Platform: general digital ads. Keep copy platform-agnostic.",
	google:
		"Platform: Google Search ads. Headlines must be tight (<= 30 characters ideally), primaryText reads like a search description. Intent-driven, keyword-aware.",
	meta: "Platform: Meta (Facebook/Instagram) feed ads. Conversational, thumb-stopping, a bit more personality; primaryText can open with a hook.",
	linkedin:
		"Platform: LinkedIn ads. Professional, credible, outcome- and ROI-oriented; speak to a business buyer.",
};

const GOAL_GUIDANCE: Record<string, string> = {
	awareness:
		"Goal: awareness. Emphasize the problem and the brand's distinct point of view. Softer CTAs ('Learn more', 'See how').",
	signups:
		"Goal: sign-ups / trials. Emphasize fast time-to-value and low friction. CTAs like 'Start free', 'Try it'.",
	sales:
		"Goal: conversions / sales. Emphasize concrete outcomes and urgency without hype. CTAs like 'Get started', 'Buy now'.",
};

type BuildMarketingPromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
	tagline?: string | null;
	mission?: string | null;
	story?: string | null;
	platform?: string;
	goal?: string;
};

const buildMarketingPrompt = ({
	brandContext,
	companyName,
	tagline,
	mission,
	story,
	platform = "generic",
	goal = "signups",
}: BuildMarketingPromptArgs): string => {
	const name = companyName ?? "the brand";
	return [
		`Write ad copy for ${name}.`,
		PLATFORM_GUIDANCE[platform] ?? PLATFORM_GUIDANCE.generic,
		GOAL_GUIDANCE[goal] ?? GOAL_GUIDANCE.signups,
		"",
		"Use the actual brand name naturally where it helps; do not use placeholder tokens.",
		"",
		brandKitBlock({ brandContext, tagline, mission, story }),
		"",
		distinctivenessBlock(brandContext),
		"",
		"Produce:",
		"- valueProp: one punchy sentence capturing the core value.",
		"- ads: exactly 3 variants, each a genuinely different angle (e.g. problem-led, outcome-led, social-proof/credibility). Each with angle, headline, primaryText, and cta.",
		"- Specific and grounded in this brand. No buzzwords or clichés.",
		"- Do NOT invent numbers, user/customer counts, percentages, ratings, awards, or testimonials. If a specific figure isn't in the brand context above, make the point without a number.",
		"",
		"Respond with JSON satisfying the provided schema.",
	].join("\n");
};

export const generateMarketing = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
		tagline: v.optional(v.string()),
		mission: v.optional(v.string()),
		story: v.optional(v.string()),
		platform: v.optional(v.string()),
		goal: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ marketing: BrandMarketing }> => {
		const prompt = buildMarketingPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
			tagline: args.tagline ?? undefined,
			mission: args.mission ?? undefined,
			story: args.story ?? undefined,
			platform: args.platform,
			goal: args.goal,
		});

		const marketing = await generateChecked({
			model: textModel(),
			system: SYSTEM_PROMPT,
			prompt,
			temperature: TEMPERATURE,
			schema: marketingSchema,
			check: (value) => copyChecks(value, prompt),
			label: "marketing",
		});

		return { marketing };
	},
});

export const marketingWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandMarketing> => {
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

		// Compose from current published blocks (no auto-regeneration).
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
		const storyDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.Story,
			})
		)?.data as { story?: string } | null;

		const options =
			(args as { options?: Record<string, string> }).options ?? {};

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Marketing,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { marketing } = await ctx.runAction(
			internal.modules.marketing.generateMarketing,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
				tagline: taglineDoc?.tagline ?? undefined,
				mission: missionDoc?.mission ?? undefined,
				story: storyDoc?.story ?? undefined,
				platform: options.platform,
				goal: options.goal,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: marketing,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return marketing;
	},
});
