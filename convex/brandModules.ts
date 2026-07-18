import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { workflow } from ".";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	action,
	internalMutation,
	internalQuery,
	type MutationCtx,
	mutation,
	type QueryCtx,
	query,
} from "./_generated/server";
import { validateBrandModuleData } from "./lib/validationHelpers";
import { GENERATION_STATUS_VALIDATOR } from "./schema";
import { type BrandModuleType, brandModuleTypeValidator } from "./workflows";

export const getModules = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		// Check access
		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
		}

		// If unauthenticated, only allow access to public companies
		if (!userId) {
			return company.isPublic
				? await ctx.db
						.query("brandModules")
						.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
						.collect()
				: [];
		}

		if (company.ownerId !== userId && !company.isPublic) {
			const membership = await ctx.db
				.query("companyMembers")
				.withIndex("by_company_user", (q) =>
					q.eq("companyId", args.companyId).eq("userId", userId)
				)
				.first();
			if (!membership) {
				return [];
			}
		}

		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect();

		return modules;
	},
});

export const listModuleTypes = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
		}

		// If unauthenticated, only allow access to public companies
		if (!userId) {
			if (!company.isPublic) {
				return [];
			}
			const modules = await ctx.db
				.query("brandModules")
				.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
				.collect();
			const types = Array.from(new Set(modules.map((m) => m.type)));
			types.sort();
			return types;
		}

		if (company.ownerId !== userId && !company.isPublic) {
			const membership = await ctx.db
				.query("companyMembers")
				.withIndex("by_company_user", (q) =>
					q.eq("companyId", args.companyId).eq("userId", userId)
				)
				.first();
			if (!membership) {
				return [];
			}
		}

		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect();
		const types = Array.from(new Set(modules.map((m) => m.type)));
		types.sort();
		return types;
	},
});

export const getModulesByType = query({
	args: { companyId: v.id("companies"), type: brandModuleTypeValidator },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
		}

		// If unauthenticated, only allow access to public companies
		if (!userId) {
			if (!company.isPublic) {
				return [];
			}
			const modules = await ctx.db
				.query("brandModules")
				.withIndex("by_company_type", (q) =>
					q.eq("companyId", args.companyId).eq("type", args.type)
				)
				.collect();
			return modules.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
		}

		if (company.ownerId !== userId && !company.isPublic) {
			const membership = await ctx.db
				.query("companyMembers")
				.withIndex("by_company_user", (q) =>
					q.eq("companyId", args.companyId).eq("userId", userId)
				)
				.first();
			if (!membership) {
				return [];
			}
		}

		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company_type", (q) =>
				q.eq("companyId", args.companyId).eq("type", args.type)
			)
			.collect();
		return modules.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
	},
});

export const updateModule = mutation({
	args: {
		moduleId: v.id("brandModules"),
		data: v.optional(v.any()),
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const module = await ctx.db.get(args.moduleId);
		if (!module) {
			throw new Error("Module not found");
		}

		const hasWriteAccess = await checkWriteAccess(
			ctx,
			module.companyId,
			userId
		);
		if (!hasWriteAccess) {
			throw new Error("Not authorized");
		}

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId: args.moduleId,
			data: args.data,
			publish: args.publish,
		});
	},
});

/**
 * Registry of workflows for brand module types.
 * Maps module types to their corresponding workflow definitions.
 */
const MODULE_WORKFLOWS = {
	name: {
		workflow: internal.modules.name.nameWorkflow,
		credits: 1,
	},
	brandContext: {
		workflow: internal.modules.brandContext.brandContextWorkflow,
		credits: 1,
	},
	logo: {
		workflow: internal.modules.logo.logoWorkflow,
		credits: 3,
	},
	colors: {
		workflow: internal.modules.colors.colorsWorkflow,
		credits: 1,
	},
	tagline: {
		workflow: internal.modules.tagline.taglineWorkflow,
		credits: 1,
	},
	mission: {
		workflow: internal.modules.mission.missionWorkflow,
		credits: 1,
	},
	story: {
		workflow: internal.modules.story.storyWorkflow,
		credits: 1,
	},
	marketing: {
		workflow: internal.modules.marketing.marketingWorkflow,
		credits: 1,
	},
	tone: {
		workflow: internal.modules.tone.toneWorkflow,
		credits: 1,
	},
	typography: {
		workflow: internal.modules.typography.typographyWorkflow,
		credits: 1,
	},
} as const;

export const checkWriteAccessInternal = internalQuery({
	args: {
		companyId: v.id("companies"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) =>
		await checkWriteAccess(ctx, args.companyId, args.userId),
});

export const regenerateModule = action({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		publish: v.optional(v.boolean()),
		// Per-module generation controls (e.g. logo colorMode/style). Each
		// workflow interprets its own keys; unrecognized options are ignored.
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);

		if (!userId) {
			throw new Error("Not authenticated");
		}

		const hasWriteAccess = await ctx.runQuery(
			internal.brandModules.checkWriteAccessInternal,
			{
				companyId: args.companyId,
				userId: userId ?? "",
			}
		);

		if (!hasWriteAccess) {
			throw new Error("Not authorized");
		}

		// Get the workflow for the module type
		const workflowRef =
			MODULE_WORKFLOWS[args.type as keyof typeof MODULE_WORKFLOWS].workflow;

		if (!workflowRef) {
			throw new Error(`No workflow registered for module type: ${args.type}`);
		}

		await ctx.runAction(internal.track.checkTrackCredits, {
			companyId: args.companyId,
			credits:
				MODULE_WORKFLOWS[args.type as keyof typeof MODULE_WORKFLOWS].credits,
			throw: true,
		});

		const result: unknown = await workflow.start(ctx, workflowRef, {
			companyId: args.companyId,
			publish: args.publish,
			options: args.options,
		});

		if (result) {
			await ctx.runAction(internal.track.checkTrackCredits, {
				companyId: args.companyId,
				credits:
					MODULE_WORKFLOWS[args.type as keyof typeof MODULE_WORKFLOWS].credits,
				deduct: true,
			});
		}

		return result;
	},
});

export const getModulesForGeneration = internalQuery({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) =>
		await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect(),
});

export const getCurrentModule = internalQuery({
	args: { companyId: v.id("companies"), type: brandModuleTypeValidator },
	handler: async (ctx, args) =>
		await ctx.db
			.query("brandModules")
			.withIndex("by_company_type_current", (q) =>
				q.eq("companyId", args.companyId).eq("type", args.type.toString())
			)
			.first(),
});

export const getPublishedModules = internalQuery({
	args: {
		companyId: v.id("companies"),
		types: v.optional(v.array(brandModuleTypeValidator)),
	},
	handler: async (ctx, args) => {
		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.filter((q) => q.eq(q.field("published"), true))
			.collect();

		let filteredModules = modules;
		if (args.types) {
			const types = args.types;
			filteredModules = modules.filter((m) =>
				types.includes(m.type as BrandModuleType)
			);
		}

		return filteredModules.reduce(
			(acc, module) => {
				acc[module.type as BrandModuleType] = module;
				return acc;
			},
			{} as Partial<Record<BrandModuleType, (typeof modules)[number]>>
		);
	},
});

export const upsertModuleByTypeInternal = internalMutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		data: v.any(),
		publish: v.optional(v.boolean()),
		generationStatus: v.optional(GENERATION_STATUS_VALIDATOR),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("brandModules")
			.withIndex("by_company_type", (q) =>
				q.eq("companyId", args.companyId).eq("type", args.type)
			)
			.first();
		const now = Date.now();
		if (existing) {
			await ctx.db.patch(existing._id, {
				data: args.data,
				published: args.publish ?? existing.published ?? false,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("brandModules", {
				companyId: args.companyId,
				type: args.type,
				data: args.data,
				published: args.publish ?? false,
				generationStatus: args.generationStatus ?? "idle",
				updatedAt: now,
				createdAt: now,
			});
		}
	},
});

export const updateModuleInternal = internalMutation({
	args: {
		moduleId: v.id("brandModules"),
		data: v.optional(v.any()),
		generationStatus: v.optional(GENERATION_STATUS_VALIDATOR),
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.get(args.moduleId);
		if (!existing) {
			throw new Error("Module not found");
		}

		const unpublishOthers = args.publish && !existing.published;

		await ctx.db.patch(args.moduleId, {
			data: args.data ?? existing.data,
			published: args.publish ?? existing.published,
			generationStatus: args.generationStatus ?? existing.generationStatus,
			updatedAt: Date.now(),
		});

		if (unpublishOthers) {
			await unpublishOtherModules(ctx, {
				companyId: existing.companyId,
				type: existing.type,
				currentModuleId: args.moduleId,
			});
		}
	},
});

export const createModuleInternal = internalMutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		data: v.optional(v.any()),
		publish: v.optional(v.boolean()),
		generationStatus: v.optional(GENERATION_STATUS_VALIDATOR),
	},
	handler: async (ctx, args): Promise<Id<"brandModules">> => {
		if (args.data) {
			const validationError = validateBrandModuleData(args.data, args.type);
			if (validationError) {
				throw new Error(`Invalid brand module data: ${validationError}`);
			}
		}
		const moduleId = await ctx.db.insert("brandModules", {
			companyId: args.companyId,
			type: args.type,
			data: args.data ?? {},
			published: args.publish ?? false,
			generationStatus: args.generationStatus ?? "idle",
			updatedAt: Date.now(),
			createdAt: Date.now(),
		});
		return moduleId;
	},
});

export const deleteModuleInternal = internalMutation({
	args: {
		moduleId: v.id("brandModules"),
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.moduleId);
	},
});

async function checkWriteAccess(
	ctx: QueryCtx | MutationCtx,
	companyId: Id<"companies">,
	userId: Id<"users"> | null
): Promise<boolean> {
	if (!userId) {
		return false;
	}

	const company = await ctx.db.get(companyId);
	if (!company) {
		throw new Error("Company not found");
	}

	if (company.ownerId === userId) {
		return true;
	}

	const membership = await ctx.db
		.query("companyMembers")
		.withIndex("by_company_user", (q) =>
			q.eq("companyId", companyId).eq("userId", userId)
		)
		.first();

	return membership?.role === "editor" || membership?.role === "owner";
}

async function unpublishOtherModules(
	ctx: MutationCtx,
	params: {
		companyId: Id<"companies">;
		type: string;
		currentModuleId: Id<"brandModules">;
	}
): Promise<void> {
	const others = await ctx.db
		.query("brandModules")
		.withIndex("by_company_type", (q) =>
			q.eq("companyId", params.companyId).eq("type", params.type)
		)
		.collect();

	for (const mod of others) {
		if (mod._id !== params.currentModuleId && mod.published) {
			await ctx.db.patch(mod._id, { published: false });
		}
	}
}
