import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { BrandModuleType, brandModuleTypeValidator } from "./workflows/modules";
import { logger } from "./logger";

export const getModules = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Check access
    const company = await ctx.db.get(args.companyId);
    if (!company) return [];

    if (company.ownerId !== userId && !company.isPublic) {
      const membership = await ctx.db
        .query("companyMembers")
        .withIndex("by_company_user", (q) => 
          q.eq("companyId", args.companyId).eq("userId", userId)
        )
        .first();
      if (!membership) return [];
    }

    const modules = await ctx.db
      .query("brandModules")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return modules;
  },
});

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
    if (!userId) throw new Error("Not authenticated");

    // Check write access
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    let hasWriteAccess = company.ownerId === userId;
    if (!hasWriteAccess) {
      const membership = await ctx.db
        .query("companyMembers")
        .withIndex("by_company_user", (q) => 
          q.eq("companyId", args.companyId).eq("userId", userId)
        )
        .first();
      hasWriteAccess = membership?.role === "editor" || membership?.role === "owner";
    }

    if (!hasWriteAccess) throw new Error("Not authorized");

    const now = Date.now();

    if (args.moduleId) {
      const existing = await ctx.db.get(args.moduleId);
      if (!existing) throw new Error("Module not found");
      await ctx.db.patch(args.moduleId, {
        data: args.data,
        published: args.publish ?? existing.published ?? false,
        updatedBy: userId,
        updatedAt: now,
      });
      if (args.publish) {
        // ensure only one published per (companyId, type, key)
        const others = await ctx.db
          .query("brandModules")
          .withIndex("by_company_type", (q) => q.eq("companyId", args.companyId).eq("type", args.type))
          .collect();
        for (const mod of others) {
          if (mod._id !== args.moduleId && mod.published) {
            await ctx.db.patch(mod._id, { published: false });
          }
        }
      }
    } else {
      await ctx.db.insert("brandModules", {
        companyId: args.companyId,
        type: args.type,
        data: args.data,
        published: args.publish ?? false,
        generationStatus: "idle",
        updatedBy: userId,
        updatedAt: now,
        createdAt: now,
      });
    }

    // Update company timestamp
    await ctx.db.patch(args.companyId, { updatedAt: now });

    // Trigger cascade updates for dependent modules
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
    if (!userId) throw new Error("Not authenticated");
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");
    if (company.ownerId !== userId ) throw new Error("Not authorized");

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
    await ctx.scheduler.runAfter(0, internal.brandModules.regenerateModuleAction, {
      companyId: args.companyId,
      type: args.type,
      moduleId: targetId,
      publish: args.publish ?? false,
    });
  },
});

export const regenerateModuleAction = internalAction({
  args: {
    companyId: v.id("companies"),
    type: brandModuleTypeValidator,
    moduleId: v.id("brandModules"),
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const log = logger.withContext({
      companyId: args.companyId,
      moduleType: args.type,
      moduleId: args.moduleId,
      step: 'regenerateModuleAction'
    });
    
    log.info('Starting module regeneration');
    
    const company = await ctx.runQuery(internal.companies.getForGeneration, {
      companyId: args.companyId,
    });

    if (!company) {
      log.error('Company not found');
      throw new Error("Company not found");
    }

    const existingModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
      companyId: args.companyId,
    });

    log.debug('Retrieved existing modules', { count: existingModules.length });

    // mark in_progress
    await ctx.runMutation(internal.brandModules.updateModuleInternal, {
      moduleId: args.moduleId,
      data: null,
      setGenerationStatus: "in_progress",
    } as any);
    log.debug('Module marked as in_progress');

    try {
      log.info('Generating module data');
      const generatedData = await ctx.runAction(internal.ai.generateBrandModule, {
        companyDescription: company.description,
        moduleType: args.type as BrandModuleType,
        existingModules,
      });

      log.info('Module generation succeeded');
      
      await ctx.runMutation(internal.brandModules.updateModuleInternal, {
        moduleId: args.moduleId,
        data: generatedData,
        publish: args.publish ?? false,
        setGenerationStatus: "succeeded",
      } as any);

      log.debug('Triggering queue reprocessing');
      // Trigger queue reprocessing to check if any pending modules can now run
      await ctx.scheduler.runAfter(0, internal.ai.processGenerationQueueAction, {
        companyId: args.companyId,
        attemptNumber: 0,
      });
    } catch (error) {
      log.error('Module generation failed', { error });
      
      // Mark as failed if generation fails
      await ctx.runMutation(internal.brandModules.updateModuleInternal, {
        moduleId: args.moduleId,
        data: null,
        setGenerationStatus: "failed",
      } as any);
      
      log.debug('Triggering queue reprocessing after failure');
      // Still trigger reprocessing in case this failure unblocks something
      await ctx.scheduler.runAfter(0, internal.ai.processGenerationQueueAction, {
        companyId: args.companyId,
        attemptNumber: 0,
      });
      
      throw error;
    }
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
      const existingOfType = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
        companyId: args.companyId,
      });

      const moduleId = await ctx.runMutation(internal.brandModules.createQueuedModuleInternal as any, {
        companyId: args.companyId,
        type: moduleType,
        now,
      });

      await ctx.scheduler.runAfter(0, internal.brandModules.regenerateModuleAction, {
        companyId: args.companyId,
        type: moduleType,
        moduleId,
        publish: false,
      });
    }
  },
});

export const getModulesForGeneration = internalQuery({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandModules")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const updateModuleInternal = internalMutation({
  args: {
    moduleId: v.id("brandModules"),
    data: v.any(),
    publish: v.optional(v.boolean()),
    setGenerationStatus: v.optional(v.union(
      v.literal("idle"),
      v.literal("queued"),
      v.literal("in_progress"),
      v.literal("succeeded"),
      v.literal("failed"),
    )),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.moduleId);

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        published: args.publish ?? existing.published ?? false,
        generationStatus: args.setGenerationStatus ?? existing.generationStatus ?? "idle",
        updatedAt: now,
      });
      if (args.publish) {
        const others = await ctx.db
          .query("brandModules")
          .withIndex("by_company_type", (q) => q.eq("companyId", existing.companyId).eq("type", existing.type))
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

export const regenerateModules = mutation({
  args: {
    companyId: v.id("companies"),
    modules: v.array(v.object({
      type: brandModuleTypeValidator,
      publish: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const m of args.modules) {
      const now = Date.now();
      const moduleId = await ctx.runMutation(internal.brandModules.createQueuedModuleInternal as any, {
        companyId: args.companyId,
        type: m.type,
        now,
      });
      await ctx.scheduler.runAfter(0, internal.brandModules.regenerateModuleAction, {
        companyId: args.companyId,
        type: m.type,
        moduleId,
        publish: m.publish ?? false,
      });
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
    if (!userId) return [] as string[];

    const company = await ctx.db.get(args.companyId);
    if (!company) return [] as string[];

    if (company.ownerId !== userId && !company.isPublic) {
      const membership = await ctx.db
        .query("companyMembers")
        .withIndex("by_company_user", (q) => q.eq("companyId", args.companyId).eq("userId", userId))
        .first();
      if (!membership) return [] as string[];
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
    if (!userId) return [] as any[];

    const company = await ctx.db.get(args.companyId);
    if (!company) return [] as any[];

    if (company.ownerId !== userId && !company.isPublic) {
      const membership = await ctx.db
        .query("companyMembers")
        .withIndex("by_company_user", (q) => q.eq("companyId", args.companyId).eq("userId", userId))
        .first();
      if (!membership) return [] as any[];
    }

    const modules = await ctx.db
      .query("brandModules")
      .withIndex("by_company_type", (q) => q.eq("companyId", args.companyId).eq("type", args.type))
      .collect();
    return modules.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});
