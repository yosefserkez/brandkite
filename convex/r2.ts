import { getAuthUserId } from "@convex-dev/auth/server";
import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type QueryCtx, query } from "./_generated/server";

export const r2 = new R2(components.r2);

// Returns the set of asset keys this viewer may access for a company (a key
// stored as a module's storageKey or in its options[]), or null if no access.
const accessibleKeys = async (
	ctx: QueryCtx,
	companyId: Id<"companies">
): Promise<Set<string> | null> => {
	const company = await ctx.db.get(companyId);
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
					q.eq("companyId", companyId).eq("userId", userId)
				)
				.first();
			if (!membership) {
				return null;
			}
		}
	}
	const modules = await ctx.db
		.query("brandModules")
		.withIndex("by_company", (q) => q.eq("companyId", companyId))
		.collect();
	const keys = new Set<string>();
	for (const m of modules) {
		const d = m.data as { storageKey?: string; options?: string[] } | undefined;
		if (d?.storageKey) {
			keys.add(d.storageKey);
		}
		if (Array.isArray(d?.options)) {
			for (const k of d.options) {
				keys.add(k);
			}
		}
	}
	return keys;
};

export const getSignedUrl = query({
	args: { key: v.optional(v.string()), companyId: v.id("companies") },
	handler: async (ctx, args) => {
		if (!args.key) {
			return;
		}
		const keys = await accessibleKeys(ctx, args.companyId);
		if (!keys?.has(args.key)) {
			return null;
		}
		return await r2.getUrl(args.key);
	},
});

export const getSignedUrls = query({
	args: { keys: v.array(v.string()), companyId: v.id("companies") },
	handler: async (ctx, args): Promise<Array<{ key: string; url: string }>> => {
		const allowed = await accessibleKeys(ctx, args.companyId);
		if (!allowed) {
			return [];
		}
		const result: Array<{ key: string; url: string }> = [];
		for (const key of args.keys) {
			if (allowed.has(key)) {
				result.push({ key, url: await r2.getUrl(key) });
			}
		}
		return result;
	},
});
