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
import type { NameModuleData } from "./name";

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

const isNonEmpty = (value: string | null | undefined): value is string =>
	typeof value === "string" && value.trim().length > 0;

const generateLogoPrompt = (params: {
	brandName: string;
	brandContext: BrandContext;
}): string => {
	const prompt = `
Minimal rounded geometric emblem for a ${params.brandContext.industry} company. 
Concept: button, circular form. 
Solid black on transparent. 
Smooth balance, soft curves, open negative space, circular symmetry, gentle flow, organic continuity. 
Keywords: button, round, soft, minimal, geometric, elegant.	
Only create the SVG emblem, do not include any wordmarks or text.`;

	return prompt;
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
	return await r2.store(ctx, file, { type: SVG_MIME_TYPE });
};

const resolveBrandName = (params: {
	companyName: string | null | undefined;
	nameModule: NameModuleData | undefined;
}): string => {
	if (isNonEmpty(params.companyName)) {
		return params.companyName.trim();
	}

	if (params.nameModule) {
		for (const entry of params.nameModule) {
			if (isNonEmpty(entry.name.name)) {
				return entry.name.name.trim();
			}
		}
	}

	return "Brand";
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
		brandName: v.string(),
		brandContext: brandContextValidator,
	},
	handler: async (ctx, args): Promise<LogoModuleData> => {
		const brandContext = args.brandContext as BrandContext;
		const prompt = generateLogoPrompt({
			brandName: args.brandName,
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
			brandName: args.brandName,
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

		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});

		const nameModuleDoc = await ctx.runQuery(
			internal.brandModules.getCurrentModule,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Name,
			}
		);

		const nameModuleData = nameModuleDoc
			? ((nameModuleDoc.data as NameModuleData | undefined) ?? undefined)
			: undefined;

		const brandName = resolveBrandName({
			companyName: company?.name,
			nameModule: nameModuleData,
		});

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
			brandName,
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

		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Logo,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const nameModuleDoc = await ctx.runQuery(
			internal.brandModules.getCurrentModule,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Name,
			}
		);

		const nameModuleData = nameModuleDoc
			? ((nameModuleDoc.data as NameModuleData | undefined) ?? undefined)
			: undefined;

		const brandName = resolveBrandName({
			companyName: company?.name,
			nameModule: nameModuleData,
		});

		const logoData = await ctx.runAction(
			internal.modules.logo.generateLogoInternal,
			{
				brandName,
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
