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
	"You are a social media strategist who writes in the brand's voice. Produce concise, human, on-brand social copy. No hashtag spam (at most one or two, only if natural), no emoji spray. Bios must fit each platform's norms.",
	COPY_CRAFT,
	NO_FABRICATION,
	DISTINCTIVE_VOICE
);
const TEMPERATURE = 0.8;
const BIO_COUNT = 3;
const POST_COUNT = 2;

const bioSchema = z.object({
	platform: z
		.string()
		.describe("Platform name: 'X', 'LinkedIn', or 'Instagram'."),
	handle: z
		.string()
		.describe("A suggested handle without the @ (e.g. 'getbrandkite')."),
	bio: z
		.string()
		.describe(
			"The bio text in the brand voice, sized for the platform (X ~140 chars, LinkedIn 1-2 lines, Instagram short + scannable)."
		),
});

const postSchema = z.object({
	hook: z.string().describe("A scroll-stopping opening line, one sentence."),
	body: z
		.string()
		.describe("1-2 short sentences that deliver the point. No hashtag spam."),
});

export const socialSchema = z.object({
	bios: z
		.array(bioSchema)
		.length(BIO_COUNT)
		.describe("Bios for X, LinkedIn, and Instagram."),
	posts: z
		.array(postSchema)
		.length(POST_COUNT)
		.describe("Two ready-to-post concepts in the brand voice."),
});

export type BrandSocial = z.infer<typeof socialSchema>;

export const socialValidator = v.object({
	bios: v.array(
		v.object({ platform: v.string(), handle: v.string(), bio: v.string() })
	),
	posts: v.array(v.object({ hook: v.string(), body: v.string() })),
});

const TONE_GUIDANCE: Record<string, string> = {
	brand: "Match the brand's own voice as described below.",
	professional: "Lean professional and credible; speak to a business audience.",
	casual: "Lean casual and conversational; warm and human.",
	bold: "Lean bold and punchy; confident and a little contrarian.",
};

type BuildSocialPromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
	tagline?: string | null;
	mission?: string | null;
	tone?: string;
};

const buildSocialPrompt = ({
	brandContext,
	companyName,
	tagline,
	mission,
	tone = "brand",
}: BuildSocialPromptArgs): string => {
	const name = companyName ?? "the brand";
	return [
		`Write a social media kit for ${name}.`,
		TONE_GUIDANCE[tone] ?? TONE_GUIDANCE.brand,
		"",
		"Use the actual brand name naturally; do not use placeholder tokens.",
		"",
		brandKitBlock({ brandContext, tagline, mission }),
		"",
		distinctivenessBlock(brandContext),
		"",
		"Produce:",
		"- bios: one each for X, LinkedIn, and Instagram (platform-appropriate length), plus a suggested handle.",
		"- posts: 2 distinct ready-to-post concepts (hook + body).",
		"- Do NOT invent numbers, user counts, or testimonials. No hashtag spam or emoji spray.",
		"",
		"Respond with JSON satisfying the provided schema.",
	].join("\n");
};

export const generateSocial = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
		tagline: v.optional(v.string()),
		mission: v.optional(v.string()),
		tone: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ social: BrandSocial }> => {
		const prompt = buildSocialPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
			tagline: args.tagline ?? undefined,
			mission: args.mission ?? undefined,
			tone: args.tone,
		});

		const social = await generateChecked({
			model: textModel(),
			system: SYSTEM_PROMPT,
			prompt,
			temperature: TEMPERATURE,
			schema: socialSchema,
			check: (value) => copyChecks(value, prompt),
			label: "social",
		});

		return { social };
	},
});

export const socialWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandSocial> => {
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
				type: BrandModuleTypes.Social,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { social } = await ctx.runAction(
			internal.modules.social.generateSocial,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
				tagline: taglineDoc?.tagline ?? undefined,
				mission: missionDoc?.mission ?? undefined,
				tone: options.tone,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: social,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return social;
	},
});
