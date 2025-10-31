import {
  query,
  mutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get companies where user is owner or member
    const ownedCompanies = await ctx.db
      .query("companies")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const memberCompanies = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberCompanyIds = memberCompanies.map(m => m.companyId);
    const memberCompanyData = await Promise.all(
      memberCompanyIds.map(id => ctx.db.get(id))
    );

    const allCompanies = [
      ...ownedCompanies,
      ...memberCompanyData.filter((c): c is NonNullable<typeof c> => c !== null)
    ];

    // Remove duplicates and sort by updatedAt
    const uniqueCompanies = allCompanies
      .filter((company, index, self) => 
        self.findIndex(c => c._id === company._id) === index
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return uniqueCompanies;
  },
});

export const get = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    // Check if user has access
    if (company.ownerId === userId) return company;
    if (company.isPublic) return company;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_user", (q) => 
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    return membership ? company : null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });

    // Generate initial brand modules using AI
    await ctx.scheduler.runAfter(0, internal.ai.generateInitialBrand, {
      companyId,
      description: args.description,
      userId,
    });

    return companyId;
  },
});

export const update = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const company = await ctx.db.get(args.companyId);
    if (!company || company.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.companyId, updates);
  },
});

export const getForGeneration = internalQuery({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});
