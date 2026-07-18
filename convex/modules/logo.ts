import { v } from "convex/values";
import Replicate from "replicate";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, action, internalAction } from "../_generated/server";
import { logger } from "../logger";
import { r2 } from "../r2";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const LOGO_MODEL_IDENTIFIER = "recraft-ai/recraft-v4.1-svg";
const SVG_MIME_TYPE = "image/svg+xml";

type WorkflowHandlerParams = Parameters<
	Parameters<(typeof workflow)["define"]>[0]["handler"]
>;
type WorkflowContext = WorkflowHandlerParams[0];
type WorkflowArgs = WorkflowHandlerParams[1];

let replicateClient: Replicate | undefined;

const getReplicateClient = (): Replicate => {
	if (!replicateClient) {
		const token = process.env.REPLICATE_API_TOKEN;
		if (!token) {
			throw new Error("REPLICATE_API_TOKEN environment variable is not set");
		}
		replicateClient = new Replicate({
			auth: token,
		});
	}
	return replicateClient;
};

type LogoColorMode = "brand" | "monochrome" | "black_and_white";
// Recraft V4.1 SVG accepts: any, engraving, line_art, line_circuit, linocut.
const LOGO_STYLE_MAP: Record<string, string> = {
	auto: "any",
	line_art: "line_art",
	engraved: "engraving",
};
export const resolveLogoStyle = (style?: string): string =>
	LOGO_STYLE_MAP[style ?? "auto"] ?? "any";

const generateLogoPrompt = (params: {
	brandContext: BrandContext;
	companyName?: string | null;
	palette?: string[];
	colorMode?: LogoColorMode;
}): string => {
	const { brandContext, companyName, palette, colorMode = "brand" } = params;

	let colorGuidance: string;
	if (colorMode === "black_and_white") {
		colorGuidance =
			"Black and white only: a solid black mark, no color, no gray fills.";
	} else if (colorMode === "monochrome") {
		colorGuidance = `Use a single solid color only${
			palette && palette.length > 0 ? ` — the brand primary ${palette[0]}` : ""
		}. No second color, no gradients.`;
	} else {
		colorGuidance =
			palette && palette.length > 0
				? `Use the brand's colors — primary ${palette[0]}${
						palette.length > 1 ? `, with ${palette.slice(1).join(" and ")}` : ""
					}. One or two colors only, solid flat fills.`
				: "Use a single solid brand color, no gradients.";
	}

	return [
		`Design a modern, distinctive logo mark (symbol/icon only, no text) for${
			companyName ? ` a brand called "${companyName}"` : " a brand"
		}.`,
		`Industry: ${brandContext.industry ?? "unspecified"}.`,
		`What the brand is: ${brandContext.summary}`,
		`Who it serves: ${brandContext.customer.summary}`,
		`Brand feel / voice: ${brandContext.brand.summary}`,
		"",
		"Design requirements:",
		"- One clean, iconic vector symbol that captures the brand's essence — specific to this brand, not a generic abstract squiggle.",
		"- Simple, balanced, memorable, and scalable: must read clearly at favicon size and as a large mark.",
		"- Flat vector shapes with clean, confident geometry. No text, letters, numbers, photorealism, 3D, or busy detail.",
		colorGuidance,
		"- Transparent background.",
	].join("\n");
};

// Recraft V3 SVG can return a FileOutput (with .url()), a plain URL string, or
// an array of either. Normalize all of these to a single URL string.
const resolveAssetUrl = async (result: unknown): Promise<string | null> => {
	const first = Array.isArray(result) ? result[0] : result;
	if (!first) {
		return null;
	}
	if (typeof first === "string") {
		return first;
	}
	const maybeUrl = (first as { url?: unknown }).url;
	if (typeof maybeUrl === "function") {
		const resolved = (maybeUrl as () => unknown).call(first);
		const awaited = resolved instanceof Promise ? await resolved : resolved;
		return awaited ? String(awaited) : null;
	}
	if (typeof maybeUrl === "string") {
		return maybeUrl;
	}
	return null;
};

const downloadAsset = async (url: string): Promise<Uint8Array> => {
	const response = await fetch(url);

	if (!response.ok) {
		logger.error("Failed to download asset from replicate output", {
			url,
			status: response.status,
			statusText: response.statusText,
		});
		throw new Error(
			`;Failed to download asset from replicate (${response.status})`
		);
	}

	const buffer = await response.arrayBuffer();

	return new Uint8Array(buffer);
};

// Compose from the current brand: pull the published color palette (hexes,
// anchor first) so the logo stays consistent with the kit. Returns [] if no
// colors module exists yet.
const getCurrentPalette = async (
	ctx: ActionCtx,
	companyId: Id<"companies">
): Promise<string[]> => {
	const colorsDoc = (
		await ctx.runQuery(internal.brandModules.getCurrentModule, {
			companyId,
			type: BrandModuleTypes.Colors,
		})
	)?.data as { colors?: Array<{ hex?: string }> } | null;
	return (
		colorsDoc?.colors
			?.map((color) => color.hex)
			.filter((hex): hex is string => Boolean(hex)) ?? []
	);
};

const generateLogoAsset = async (
	ctx: ActionCtx,
	prompt: string,
	style?: string
): Promise<string> => {
	const client = getReplicateClient();
	logger.info("Generating logo asset", { prompt, style });
	const replicateResult = await client.run(LOGO_MODEL_IDENTIFIER, {
		input: { prompt, size: "1024x1024", style: resolveLogoStyle(style) },
	});

	logger.info("Replicate result", { replicateResult });
	const assetUrl = await resolveAssetUrl(replicateResult);

	if (!assetUrl) {
		logger.error("Failed to resolve asset URL from replicate response", {
			replicateResult,
		});
		throw new Error("Logo generation failed to return an asset URL");
	}

	const file = await downloadAsset(assetUrl);
	const svgText = new TextDecoder().decode(file);

	const cleanedBytes = new TextEncoder().encode(svgText);
	return await r2.store(ctx, cleanedBytes, { type: SVG_MIME_TYPE });
};

export const logoSchema = z.object({
	storageKey: z
		.string()
		.min(1)
		.describe("Cloudflare R2 object key for the stored logo asset."),
	prompt: z
		.string()
		.min(1)
		.describe("Prompt submitted to the Recraft SVG model."),
	model: z
		.string()
		.min(1)
		.describe("Model identifier used to generate the logo."),
	generatedAt: z
		.number()
		.describe(
			"Timestamp when the logo was generated (milliseconds since epoch)."
		),
});

export type LogoModuleData = z.infer<typeof logoSchema>;

export const generateLogoInternal = internalAction({
	args: {
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
		palette: v.optional(v.array(v.string())),
		colorMode: v.optional(v.string()),
		style: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<LogoModuleData> => {
		const brandContext = args.brandContext as BrandContext;
		const prompt = generateLogoPrompt({
			brandContext,
			companyName: args.companyName,
			palette: args.palette,
			colorMode: (args.colorMode as LogoColorMode | undefined) ?? "brand",
		});

		const storageKey = await generateLogoAsset(ctx, prompt, args.style);
		const result: LogoModuleData = {
			storageKey,
			prompt,
			model: LOGO_MODEL_IDENTIFIER,
			generatedAt: Date.now(),
		};

		logger.info("Generated logo", {
			storageKey,
		});

		return result;
	},
});

export const generateLogo = action({
	args: {
		companyId: v.id("companies"),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<LogoModuleData> => {
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
		const palette = await getCurrentPalette(ctx, args.companyId);

		const logoAction =
			(
				(internal.modules as Record<string, unknown>).logo as
					| {
							generateLogoInternal: Parameters<typeof ctx.runAction>[0];
					  }
					| undefined
			)?.generateLogoInternal ??
			(generateLogoInternal as unknown as Parameters<typeof ctx.runAction>[0]);

		return await ctx.runAction(logoAction, {
			brandContext: brandContextDoc,
			companyName: company?.name ?? undefined,
			palette,
			colorMode: args.options?.colorMode,
			style: args.options?.style,
		});
	},
});

export const logoWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (
		ctx: WorkflowContext,
		args: WorkflowArgs
	): Promise<LogoModuleData> => {
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
		const colorsDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.Colors,
			})
		)?.data as { colors?: Array<{ hex?: string }> } | null;
		const palette =
			colorsDoc?.colors
				?.map((color) => color.hex)
				.filter((hex): hex is string => Boolean(hex)) ?? [];

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Logo,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const options = (args as { options?: Record<string, string> }).options;
		const logoData = await ctx.runAction(
			internal.modules.logo.generateLogoInternal,
			{
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
				palette,
				colorMode: options?.colorMode,
				style: options?.style,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: logoData,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		logger.info("Logo module updated", {
			moduleId,
			companyId: args.companyId,
		});

		return logoData;
	},
});
