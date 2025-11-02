import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	internalAction,
	internalMutation,
	internalQuery,
	type MutationCtx,
	mutation,
	query,
} from "./_generated/server";
import { logger } from "./logger";
import { type BrandModuleType, brandModuleTypeValidator } from "./workflows";

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

export const getModules = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Check access
		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
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

async function checkWriteAccess(
	ctx: MutationCtx,
	companyId: Id<"companies">,
	userId: Id<"users">
): Promise<boolean> {
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

async function updateExistingModule(
	ctx: MutationCtx,
	params: {
		moduleId: Id<"brandModules">;
		data: unknown;
		publish: boolean | undefined;
		companyId: Id<"companies">;
		type: string;
		userId: Id<"users">;
		now: number;
	}
): Promise<void> {
	const existing = await ctx.db.get(params.moduleId);
	if (!existing) {
		throw new Error("Module not found");
	}

	await ctx.db.patch(params.moduleId, {
		data: params.data,
		published: params.publish ?? existing.published ?? false,
		updatedBy: params.userId,
		updatedAt: params.now,
	});

	if (params.publish) {
		await unpublishOtherModules(ctx, {
			companyId: params.companyId,
			type: params.type,
			currentModuleId: params.moduleId,
		});
	}
}

async function createNewModule(
	ctx: MutationCtx,
	params: {
		companyId: Id<"companies">;
		type: string;
		data: unknown;
		publish: boolean | undefined;
		userId: Id<"users">;
		now: number;
	}
): Promise<void> {
	await ctx.db.insert("brandModules", {
		companyId: params.companyId,
		type: params.type,
		data: params.data,
		published: params.publish ?? false,
		generationStatus: "idle",
		updatedBy: params.userId,
		updatedAt: params.now,
		createdAt: params.now,
	});
}

export const updateModule = mutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		data: v.any(),
		moduleId: v.optional(v.id("brandModules")),
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const hasWriteAccess = await checkWriteAccess(ctx, args.companyId, userId);
		if (!hasWriteAccess) {
			throw new Error("Not authorized");
		}

		const now = Date.now();

		if (args.moduleId) {
			await updateExistingModule(ctx, {
				moduleId: args.moduleId,
				data: args.data,
				publish: args.publish,
				companyId: args.companyId,
				type: args.type,
				userId,
				now,
			});
		} else {
			await createNewModule(ctx, {
				companyId: args.companyId,
				type: args.type,
				data: args.data,
				publish: args.publish,
				userId,
				now,
			});
		}

		await ctx.db.patch(args.companyId, { updatedAt: now });

		await ctx.scheduler.runAfter(0, internal.brandModules.cascadeUpdates, {
			companyId: args.companyId,
			updatedModuleType: args.type,
			userId,
		});
	},
});

export const regenerateModule = mutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		const company = await ctx.db.get(args.companyId);
		if (!company) {
			throw new Error("Company not found");
		}
		if (company.ownerId !== userId) {
			throw new Error("Not authorized");
		}

		// Create a new queued instance
		const now = Date.now();
		const targetId = await ctx.db.insert("brandModules", {
			companyId: args.companyId,
			type: args.type,
			data: null,
			published: false,
			generationStatus: "queued",
			updatedAt: now,
			createdAt: now,
		});

		// Schedule the regeneration
		await ctx.scheduler.runAfter(
			0,
			internal.brandModules.regenerateModuleAction,
			{
				companyId: args.companyId,
				type: args.type,
				moduleId: targetId,
				publish: args.publish ?? false,
			}
		);
	},
});

export const regenerateModuleAction = internalAction({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		moduleId: v.id("brandModules"),
		publish: v.optional(v.boolean()),
		inputContent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const log = logger.withContext({
			companyId: args.companyId,
			moduleType: args.type,
			moduleId: args.moduleId,
			step: "regenerateModuleAction",
		});

		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});

		if (!company) {
			log.error("Company not found");
			throw new Error("Company not found");
		}

		// todo: run workflow for module type. it will create the module set it as in progress and update the generation status to succeeded or failed.
	},
});

export const cascadeUpdates = internalAction({
	args: {
		companyId: v.id("companies"),
		updatedModuleType: brandModuleTypeValidator,
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Define dependencies between modules
		const dependencies: Record<string, string[]> = {};

		const dependentModules = dependencies[args.updatedModuleType] || [];

		for (const moduleType of dependentModules as BrandModuleType[]) {
			// Create new queued version for dependent module
			const now = Date.now();
			const _existingOfType = await ctx.runQuery(
				internal.brandModules.getModulesForGeneration,
				{
					companyId: args.companyId,
				}
			);

			const moduleId = await ctx.runMutation(
				internal.brandModules.createQueuedModuleInternal,
				{
					companyId: args.companyId,
					type: moduleType,
					now,
				}
			);

			await ctx.scheduler.runAfter(
				0,
				internal.brandModules.regenerateModuleAction,
				{
					companyId: args.companyId,
					type: moduleType,
					moduleId,
					publish: false,
				}
			);
		}
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

export const updateModuleInternal = internalMutation({
	args: {
		moduleId: v.id("brandModules"),
		data: v.any(),
		publish: v.optional(v.boolean()),
		setGenerationStatus: v.optional(
			v.union(
				v.literal("idle"),
				v.literal("queued"),
				v.literal("in_progress"),
				v.literal("succeeded"),
				v.literal("failed")
			)
		),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.get(args.moduleId);

		const now = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				data: args.data,
				published: args.publish ?? existing.published ?? false,
				generationStatus:
					args.setGenerationStatus ?? existing.generationStatus ?? "idle",
				updatedAt: now,
			});
			if (args.publish) {
				const others = await ctx.db
					.query("brandModules")
					.withIndex("by_company_type", (q) =>
						q.eq("companyId", existing.companyId).eq("type", existing.type)
					)
					.collect();
				for (const mod of others) {
					if (mod._id !== existing._id && mod.published) {
						await ctx.db.patch(mod._id, { published: false });
					}
				}
				// Only update company timestamp when publishing (user-facing action)
				await ctx.db.patch(existing.companyId, { updatedAt: now });
			}
		}
	},
});

export const upsertModuleInternal = internalMutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		data: v.any(),
		publish: v.optional(v.boolean()),
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
				generationStatus: "idle",
				updatedAt: now,
				createdAt: now,
			});
		}
	},
});

export const regenerateModules = mutation({
	args: {
		companyId: v.id("companies"),
		modules: v.array(
			v.object({
				type: brandModuleTypeValidator,
				publish: v.optional(v.boolean()),
			})
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		for (const m of args.modules) {
			const now = Date.now();
			const moduleId = await ctx.runMutation(
				internal.brandModules.createQueuedModuleInternal,
				{
					companyId: args.companyId,
					type: m.type,
					now,
				}
			);
			await ctx.scheduler.runAfter(
				0,
				internal.brandModules.regenerateModuleAction,
				{
					companyId: args.companyId,
					type: m.type,
					moduleId,
					publish: m.publish ?? false,
				}
			);
		}
	},
});

export const createQueuedModuleInternal = internalMutation({
	args: {
		companyId: v.id("companies"),
		type: brandModuleTypeValidator,
		now: v.number(),
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert("brandModules", {
			companyId: args.companyId,
			type: args.type,
			data: null,
			published: false,
			generationStatus: "queued",
			updatedAt: args.now,
			createdAt: args.now,
		});
		return id;
	},
});

export const listModuleTypes = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
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
		if (!userId) {
			return [];
		}

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return [];
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
