import { getAuthUserId } from "@convex-dev/auth/server";
import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

export const r2 = new R2(components.r2);

export const getSignedUrl = query({
	args: { key: v.optional(v.string()), companyId: v.id("companies") },
	handler: async (ctx, args) => {
		if (!args.key) {
			return;
		}

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return null;
		}

		if (!company.isPublic) {
			const userId = await getAuthUserId(ctx);
			if (!userId) {
				return null;
			}
			if (company.ownerId !== userId) {
				const membership = await ctx.db
					.query("companyMembers")
					.withIndex("by_company_user", (q) =>
						q.eq("companyId", args.companyId).eq("userId", userId)
					)
					.first();
				if (!membership) {
					return null;
				}
			}
		}

		// The key must belong to one of this company's modules — otherwise any
		// caller could mint a URL for an arbitrary key under a company they can view.
		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect();
		const ownsKey = modules.some(
			(module) => module.data?.storageKey === args.key
		);
		if (!ownsKey) {
			return null;
		}

		return await r2.getUrl(args.key);
	},
});
