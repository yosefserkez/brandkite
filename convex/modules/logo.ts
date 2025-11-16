import { v } from "convex/values";
import Replicate from "replicate";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { type ActionCtx, action, internalAction } from "../_generated/server";
import { logger } from "../logger";
import { r2 } from "../r2";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const LOGO_MODEL_IDENTIFIER = "recraft-ai/recraft-20b-svg";
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

const generateLogoPrompt = (params: { brandContext: BrandContext }): string => {
	const prompt = `
Minimal rounded geometric emblem for a ${params.brandContext.industry} company. 
Concept: button, circular form. 
Solid black on transparent background. 
Smooth balance, soft curves, open negative space, circular symmetry, gentle flow, organic continuity. 
Keywords: button, round, soft, minimal, geometric, elegant.	
Only create the SVG emblem, do not include any wordmarks or text. NO BACKGROUND. NO WORDS OR TEXT. TRANSPARENT`;

	return prompt;
};

const PATH_TAG_GLOBAL_REGEX = /<path\b[^>]*>/gi;
const WHITE_FILL_REGEXES = [
	/\bfill\s*=\s*"(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))"/i,
	/\bfill\s*=\s*'(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))'/i,
	/\bstyle\s*=\s*"[^"]*\bfill\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\b[^"]*"/i,
	/\bstyle\s*=\s*'[^']*\bfill\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\b[^']*'/i,
];

// Replacement regexes to set white fills to transparent
const FILL_ATTR_DOUBLE_WHITE =
	/\bfill\s*=\s*"(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))"/gi;
const FILL_ATTR_SINGLE_WHITE =
	/\bfill\s*=\s*'(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))'/gi;
const STYLE_DOUBLE_WHITE_FILL =
	/\bstyle\s*=\s*"([^"]*?)\bfill\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))([^"]*)"/gi;
const STYLE_SINGLE_WHITE_FILL =
	/\bstyle\s*=\s*'([^']*?)\bfill\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))([^']*)'/gi;

const makeWhiteBackgroundTransparentInSvg = (
	svgString: string
): { svg: string; removed: boolean } => {
	let modifiedAny = false;
	const updatedSvg = svgString.replace(PATH_TAG_GLOBAL_REGEX, (tag) => {
		const isWhite = WHITE_FILL_REGEXES.some((re) => re.test(tag));
		if (isWhite) {
			modifiedAny = true;
			let newTag = tag;
			newTag = newTag.replace(FILL_ATTR_DOUBLE_WHITE, 'fill="none"');
			newTag = newTag.replace(FILL_ATTR_SINGLE_WHITE, 'fill="none"');
			newTag = newTag.replace(
				STYLE_DOUBLE_WHITE_FILL,
				'style="$1fill: none$2"'
			);
			newTag = newTag.replace(
				STYLE_SINGLE_WHITE_FILL,
				"style='$1fill: none$2'"
			);
			return newTag;
		}
		return tag;
	});
	return { svg: updatedSvg, removed: modifiedAny };
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
			`Failed to download asset from replicate (${response.status})`
		);
	}

	const buffer = await response.arrayBuffer();

	return new Uint8Array(buffer);
};

const generateLogoAsset = async (
	ctx: ActionCtx,
	prompt: string
): Promise<string> => {
	const client = getReplicateClient();
	logger.info("Generating logo asset", { prompt });
	const replicateResult = await client.run(LOGO_MODEL_IDENTIFIER, {
		input: { prompt },
	});

	logger.info("Replicate result", { replicateResult });
	// @ts-expect-error - False positive
	const assetUrl = await replicateResult.url();

	if (!assetUrl) {
		logger.error("Failed to resolve asset URL from replicate response", {
			replicateResult,
		});
		throw new Error("Logo generation failed to return an asset URL");
	}

	const file = await downloadAsset(assetUrl);
	const svgText = new TextDecoder().decode(file);
	const { svg: cleanedSvg, removed } =
		makeWhiteBackgroundTransparentInSvg(svgText);

	if (removed) {
		logger.info("Converted white background paths to transparent in SVG");
	}

	const cleanedBytes = new TextEncoder().encode(cleanedSvg);
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
	},
	handler: async (ctx, args): Promise<LogoModuleData> => {
		const brandContext = args.brandContext as BrandContext;
		const prompt = generateLogoPrompt({
			brandContext,
		});

		const storageKey = await generateLogoAsset(ctx, prompt);
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
		});
	},
});

export const logoWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
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

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Logo,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const logoData = await ctx.runAction(
			internal.modules.logo.generateLogoInternal,
			{
				brandContext: brandContextDoc,
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
