import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { r2 } from "./r2";

const slugify = (s: string): string =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40) || "brand";

const withName = (text: string | undefined, name: string): string =>
	text ? text.replace(/{company_name}/g, name) : "";

// Owner publishes the company's live landing site. Generates a unique slug.
export const publishSite = mutation({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args): Promise<string> => {
		const userId = await getAuthUserId(ctx);
		const company = await ctx.db.get(args.companyId);
		if (!company || company.ownerId !== userId) {
			throw new Error("Not authorized");
		}
		let slug = company.siteSlug;
		if (!slug) {
			const base = slugify(company.name);
			const taken = await ctx.db
				.query("companies")
				.withIndex("by_site_slug", (q) => q.eq("siteSlug", base))
				.first();
			slug =
				taken && taken._id !== args.companyId
					? `${base}-${args.companyId.slice(-4)}`
					: base;
		}
		await ctx.db.patch(args.companyId, {
			siteSlug: slug,
			sitePublished: true,
			updatedAt: Date.now(),
		});
		return slug;
	},
});

export const unpublishSite = mutation({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args): Promise<void> => {
		const userId = await getAuthUserId(ctx);
		const company = await ctx.db.get(args.companyId);
		if (!company || company.ownerId !== userId) {
			throw new Error("Not authorized");
		}
		await ctx.db.patch(args.companyId, {
			sitePublished: false,
			updatedAt: Date.now(),
		});
	},
});

// Studio status for the publish control.
export const getSiteStatus = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return null;
		}
		return {
			published: Boolean(company.sitePublished),
			slug: company.siteSlug ?? null,
		};
	},
});

// Public render payload for the live site. No auth — it's a published page.
export const getSiteBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const company = await ctx.db
			.query("companies")
			.withIndex("by_site_slug", (q) => q.eq("siteSlug", args.slug))
			.first();
		if (!company?.sitePublished) {
			return null;
		}

		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", company._id))
			.filter((q) => q.eq(q.field("published"), true))
			.collect();
		const byType: Record<string, unknown> = {};
		for (const m of modules) {
			byType[m.type] = m.data;
		}

		const name = company.name;
		const logoData = byType.logo as { storageKey?: string } | undefined;
		const logoUrl = logoData?.storageKey
			? await r2.getUrl(logoData.storageKey)
			: null;
		const colors = byType.colors as
			| { colors?: Array<{ hex: string; name: string; role: string }> }
			| undefined;
		const typography = byType.typography as
			| {
					headlineFont?: { name?: string };
					primaryFont?: { name?: string };
			  }
			| undefined;
		const website = byType.website as
			| {
					hero?: { headline?: string; subheadline?: string };
					features?: Array<{ title?: string; description?: string }>;
					cta?: { headline?: string; buttonText?: string };
			  }
			| undefined;
		const tagline = (byType.tagline as { tagline?: string } | undefined)
			?.tagline;

		return {
			name,
			tagline: withName(tagline, name),
			logoUrl,
			colors: colors?.colors ?? [],
			fonts: {
				headline: typography?.headlineFont?.name ?? null,
				body: typography?.primaryFont?.name ?? null,
			},
			website: website
				? {
						hero: {
							headline: withName(website.hero?.headline, name),
							subheadline: withName(website.hero?.subheadline, name),
						},
						features: (website.features ?? []).map((f) => ({
							title: withName(f.title, name),
							description: withName(f.description, name),
						})),
						cta: {
							headline: withName(website.cta?.headline, name),
							buttonText: website.cta?.buttonText ?? "Get started",
						},
					}
				: null,
		};
	},
});
