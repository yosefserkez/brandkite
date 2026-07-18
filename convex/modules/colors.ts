import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const MODEL_NAME = "x-ai/grok-4.3";
const SYSTEM_PROMPT =
	"You are a senior brand color strategist. Create emotionally resonant yet practical color palettes that translate a brand strategy into a usable design system. Use the literal token {company_name} whenever you reference the brand in the story. Never output the actual brand name.";

const HEX_PREFIX = "#";
const HEX_FULL_LENGTH = 6;
const HEX_START_INDEX = 0;
const PALETTE_COLOR_COUNT = 3;

const hexRegex = /^#?[0-9A-F]{6}$/i;

const paletteColorSchema = z.object({
	name: z
		.string()
		.describe(
			"Distinctive color name that reinforces the brand feeling (1-3 words)."
		),
	role: z
		.string()
		.describe(
			"Functional role reference like 'Primary anchor', 'Supportive accent', 'Warm neutral'."
		),
	hex: z
		.string()
		.describe("Primary swatch hex, uppercase and prefixed with #.")
		.refine(
			(value) => hexRegex.test(value),
			"Must be a valid 6-digit hex color."
		),
	summary: z
		.string()
		.describe(
			"One concise sentence on why this color earns a place in the palette, referencing the brand context."
		),
	usage: z
		.string()
		.describe(
			"Concise specific guidance (1-2 sentences) for when and where to apply the color across digital/print."
		),
});

export const colorsSchema = z.object({
	overview: z
		.string()
		.describe(
			"2-3 concise sentences weaving the three colors together similar to a brand rationale paragraph."
		),
	howToUse: z
		.string()
		.describe(
			"1-2 concise sentence macro guidance on orchestrating the palette (hierarchy, accessibility, balance)."
		),
	colors: z
		.array(paletteColorSchema)
		.length(PALETTE_COLOR_COUNT)
		.describe("Exactly three color entries: anchor, support, and accent."),
});

export type BrandPalette = z.infer<typeof colorsSchema>;
export type BrandPaletteColor = z.infer<typeof paletteColorSchema>;

export const colorsValidator = v.object({
	overview: v.string(),
	howToUse: v.string(),
	colors: v.array(
		v.object({
			name: v.string(),
			role: v.string(),
			hex: v.string(),
			summary: v.string(),
			usage: v.string(),
		})
	),
});

type GeneratePaletteArgs = {
	companyId: Id<"companies">;
	brandContext: BrandContext;
	companyName?: string | null;
};

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const buildPrompt = (args: GeneratePaletteArgs): string => {
	const { brandContext, companyName } = args;

	const inspirationLines = brandContext.brand.inspirations
		.map((inspiration) => `- ${inspiration.name}: ${inspiration.summary}`)
		.join("\n");

	const competitorLines = brandContext.market.competitors
		.map((competitor) => `- ${competitor.name}: ${competitor.summary}`)
		.join("\n");

	return [
		`Brand name: ${companyName ?? "Unnamed brand"}`,
		"",
		"Brand personality summary:",
		brandContext.brand.summary,
		"",
		"Customer insight:",
		brandContext.customer.summary,
		"",
		"Product context:",
		brandContext.product.summary,
		"",
		"Market posture:",
		brandContext.market.summary,
		"",
		inspirationLines
			? ["Visual inspirations to nod toward:", inspirationLines].join("\n")
			: "",
		competitorLines
			? [
					"",
					"Competitors to differentiate from (avoid similar palettes):",
					competitorLines,
				].join("\n")
			: "",
		"",
		"Design goal: Craft a cohesive three-color palette that mirrors the brand document tone while clearly differentiating from competitors.",
		"",
		"Palette requirements:",
		"- Provide exactly three colors (anchor, support, accent) that work digitally and in print.",
		"- Names should be evocative and short. Avoid generic color words.",
		"- Hex values must be 6-digit uppercase codes prefixed with #.",
		"- Summaries and usage guidance should cite how each color reinforces the brand strategy and how to deploy it.",
		"- Overview paragraph should read like the sample provided in the reference.",
		"- howToUse should give practical guidance on hierarchy, accessibility, and balance.",
		"",
		"Respond strictly in JSON that satisfies the provided schema.",
	].join("\n");
};

const normalizeHex = (value: string): string => {
	const trimmed = value.trim();
	const hex = trimmed.startsWith(HEX_PREFIX)
		? trimmed.slice(HEX_PREFIX.length)
		: trimmed;
	const upper = hex.slice(HEX_START_INDEX, HEX_FULL_LENGTH).toUpperCase();
	return `${HEX_PREFIX}${upper}`;
};

const normalizePalette = (palette: BrandPalette): BrandPalette => ({
	overview: palette.overview.trim(),
	howToUse: palette.howToUse.trim(),
	colors: palette.colors.map((color) => ({
		name: color.name.trim(),
		role: color.role.trim(),
		hex: normalizeHex(color.hex),
		summary: color.summary.trim(),
		usage: color.usage.trim(),
	})),
});

export const generateBrandPalette = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ palette: BrandPalette }> => {
		const prompt = buildPrompt({
			brandContext: args.brandContext,
			companyId: args.companyId,
			companyName: args.companyName ?? null,
		});

		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: colorsSchema }),
			prompt,
			temperature: 0.7,
		});

		const palette = normalizePalette(object.value);
		return { palette };
	},
});

export const colorsWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandPalette> => {
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
				type: BrandModuleTypes.Colors,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { palette } = await ctx.runAction(
			internal.modules.colors.generateBrandPalette,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: palette,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return palette;
	},
});
