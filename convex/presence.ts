import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updatePresence = mutation({
  args: {
    companyId: v.id("companies"),
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_company_user", (q) => 
        q.eq("companyId", args.companyId).eq("userId", userId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        section: args.section,
        lastSeen: now,
      });
    } else {
      await ctx.db.insert("presence", {
        companyId: args.companyId,
        userId,
        section: args.section,
        lastSeen: now,
      });
    }
  },
});

export const getPresence = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.gt(q.field("lastSeen"), fiveMinutesAgo))
      .collect();

    // Get user details for each presence
    const presenceWithUsers = await Promise.all(
      presence.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user: user ? { 
            _id: user._id, 
            name: user.name || user.email || "Anonymous",
            email: user.email 
          } : null,
        };
      })
    );

    return presenceWithUsers.filter(p => p.user && p.userId !== userId);
  },
});
