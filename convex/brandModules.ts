import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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
    type: v.union(
      v.literal("foundations"),
      v.literal("visual"),
      v.literal("verbal"),
      v.literal("applications"),
      v.literal("governance")
    ),
    data: v.any(),
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
        version: existing.version + 1,
        updatedBy: userId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("brandModules", {
        companyId: args.companyId,
        type: args.type,
        data: args.data,
        version: 1,
        updatedBy: userId,
        updatedAt: now,
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
    type: v.union(
      v.literal("foundations"),
      v.literal("visual"),
      v.literal("verbal"),
      v.literal("applications"),
      v.literal("governance")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Schedule the regeneration
    await ctx.scheduler.runAfter(0, internal.brandModules.regenerateModuleAction, {
      companyId: args.companyId,
      type: args.type,
    });
  },
});

export const regenerateModuleAction = internalAction({
  args: {
    companyId: v.id("companies"),
    type: v.union(
      v.literal("foundations"),
      v.literal("visual"),
      v.literal("verbal"),
      v.literal("applications"),
      v.literal("governance")
    ),
  },
  handler: async (ctx, args) => {
    const company = await ctx.runQuery(internal.companies.getForGeneration, {
      companyId: args.companyId,
    });

    if (!company) throw new Error("Company not found");

    const existingModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
      companyId: args.companyId,
    });

    const generatedData = await ctx.runAction(internal.ai.generateBrandModule, {
      companyDescription: company.description,
      moduleType: args.type,
      existingModules,
    });

    await ctx.runMutation(internal.brandModules.updateModuleInternal, {
      companyId: args.companyId,
      type: args.type,
      data: generatedData,
    });
  },
});

export const cascadeUpdates = internalAction({
  args: {
    companyId: v.id("companies"),
    updatedModuleType: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Define dependencies between modules
    const dependencies: Record<string, string[]> = {
      foundations: ["verbal", "visual", "applications"],
      visual: ["applications"],
      verbal: ["applications"],
    };

    const dependentModules = dependencies[args.updatedModuleType] || [];
    
    for (const moduleType of dependentModules) {
      // Get current module data
      const modules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
        companyId: args.companyId,
      });

      const company = await ctx.runQuery(internal.companies.getForGeneration, {
        companyId: args.companyId,
      });

      if (!company) continue;

      // Regenerate dependent module
      const updatedData = await ctx.runAction(internal.ai.generateBrandModule, {
        companyDescription: company.description,
        moduleType: moduleType as any,
        existingModules: modules,
      });

      await ctx.runMutation(internal.brandModules.updateModuleInternal, {
        companyId: args.companyId,
        type: moduleType as any,
        data: updatedData,
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
    companyId: v.id("companies"),
    type: v.union(
      v.literal("foundations"),
      v.literal("visual"),
      v.literal("verbal"),
      v.literal("applications"),
      v.literal("governance")
    ),
    data: v.any(),
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
        version: existing.version + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("brandModules", {
        companyId: args.companyId,
        type: args.type,
        data: args.data,
        version: 1,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.companyId, { updatedAt: now });
  },
});
