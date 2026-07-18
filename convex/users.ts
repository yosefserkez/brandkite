import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";

export const viewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const user = await ctx.db.get(userId);
		return user;
	},
});

/**
 * Used by the Autumn identify callback, which runs in an action and has no
 * `ctx.db`, to look up the authenticated user's name/email for billing.
 */
export const getUserForBilling = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			return null;
		}

		return {
			name: user.name,
			email: user.email,
		};
	},
});

