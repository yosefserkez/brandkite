import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { logger } from "./logger";
import {
	BRAND_MODULE_TYPES,
	type BrandModuleType,
	brandModuleTypeValidator,
} from "./workflows/modules";

export const generateBrandModule = internalAction({
	args: {
		companyDescription: v.string(),
		moduleType: brandModuleTypeValidator,
		existingModules: v.array(v.any()),
		inputContent: v.optional(v.string()),
	},
	handler: async (ctx, args) => ({
		data: {
			summary: "test summary",
			marketSize: "test market size",
		},
	}),
});

export const generateInitialBrand = internalAction({
	args: {
		companyId: v.id("companies"),
		description: v.string(),
		userId: v.id("users"),
		inputContent: v.optional(v.string()), // Combined content from user inputs
	},
	handler: async (ctx, args) => {
		const log = logger.withContext({
			companyId: args.companyId,
			userId: args.userId,
			step: "generateInitialBrand",
		});

		log.info("Starting initial brand generation", {
			hasInputContent: !!args.inputContent,
		});

		// Step 1: Generate context modules first (team, customer, product, market, business, brandContext)
		const contextModuleTypes: BrandModuleType[] = [
			"team",
			"customer",
			"product",
			"market",
			"business",
			"brandContext",
		] as BrandModuleType[];

		log.debug("Generating context modules first", {
			contextModuleTypes,
			count: contextModuleTypes.length,
		});
		await queueModulesForGeneration(
			ctx,
			args.companyId,
			contextModuleTypes,
			args.description,
			args.inputContent
		);

		// Step 2: Generate brand modules (name, tagline, mission, etc.)
		// Filter out context modules and tagline from brand modules
		const brandModuleTypes: BrandModuleType[] = BRAND_MODULE_TYPES.filter(
			(type) => !contextModuleTypes.includes(type) && type !== "tagline"
		) as BrandModuleType[];

		log.debug("Generating brand modules", {
			brandModuleTypes,
			count: brandModuleTypes.length,
		});

		// Queue brand modules - they can use the context modules as dependencies
		await queueModulesForGeneration(
			ctx,
			args.companyId,
			brandModuleTypes,
			args.description,
			args.inputContent
		);

		log.info("Initial brand generation queued");
	},
});

/**
 * Process the generation queue with dependency handling
 */
export const processGenerationQueueAction = internalAction({
	args: {
		companyId: v.id("companies"),
		attemptNumber: v.optional(v.number()),
		inputContent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// For retries, we still need inputContent in case context modules haven't completed yet
		// Get company to pass description, but inputContent is passed from args
		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});
		if (!company) {
			throw new Error("Company not found");
		}

		// Get queued modules to reprocess
		const currentModules = await ctx.runQuery(
			internal.brandModules.getModulesForGeneration,
			{
				companyId: args.companyId,
			}
		);
		const queuedModules = currentModules.filter(
			(m) => m.generationStatus === "queued"
		);

		if (queuedModules.length === 0) {
			return; // Nothing to process
		}

		const moduleIds: Record<string, any> = {};
		for (const module of queuedModules) {
			moduleIds[module.type] = module._id;
		}

		// Import orchestrator function
		const { processGenerationQueue } = await import("./workflows/orchestrator");
		await processGenerationQueue(
			ctx,
			args.companyId,
			moduleIds,
			company.description,
			args.inputContent,
			args.attemptNumber ?? 0
		);
	},
});
