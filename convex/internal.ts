import { internalQuery, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const getForGeneration = internalQuery({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});
