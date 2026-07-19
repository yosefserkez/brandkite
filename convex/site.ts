import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { r2 } from "./r2";

const SLUG_MAX = 40;
const SLUG_MIN = 3;
const SLUG_SUFFIX_LEN = 4;
// 7 days — the R2/S3 signed-URL max — so the logo survives as the site og:image.
const SITE_URL_TTL_SECONDS = 604_800;

// Normalize to url-safe slug chars. Returns "" for input with no usable chars
// (callers decide the fallback / error).
const cleanSlug = (s: string): string =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX);

const slugify = (s: string): string => cleanSlug(s) || "brand";

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
					? `${base}-${args.companyId.slice(-SLUG_SUFFIX_LEN)}`
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

// Owner sets a custom URL slug for their site. Validated + globally unique.
export const setSiteSlug = mutation({
	args: { companyId: v.id("companies"), slug: v.string() },
	handler: async (ctx, args): Promise<string> => {
		const userId = await getAuthUserId(ctx);
		const company = await ctx.db.get(args.companyId);
		if (!company || company.ownerId !== userId) {
			throw new Error("Not authorized");
		}
		const desired = cleanSlug(args.slug);
		if (desired.length < SLUG_MIN) {
			throw new Error(
				`URL must be at least ${SLUG_MIN} characters (letters, numbers, hyphens).`
			);
		}
		if (desired === company.siteSlug) {
			return desired;
		}
		const taken = await ctx.db
			.query("companies")
			.withIndex("by_site_slug", (q) => q.eq("siteSlug", desired))
			.first();
		if (taken && taken._id !== args.companyId) {
			throw new Error("That URL is already taken. Try another.");
		}
		await ctx.db.patch(args.companyId, {
			siteSlug: desired,
			updatedAt: Date.now(),
		});
		return desired;
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

// Assemble the render payload for a company's site from its published modules.
// Shared by the public route and the owner preview.
async function buildSitePayload(ctx: QueryCtx, company: Doc<"companies">) {
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
	// 7 days (R2/S3 signed-URL max) so this URL survives as the site's
	// og:image — link unfurlers must still resolve it well after sharing.
	const logoUrl = logoData?.storageKey
		? await r2.getUrl(logoData.storageKey, { expiresIn: SITE_URL_TTL_SECONDS })
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
	const tagline = (byType.tagline as { tagline?: string } | undefined)?.tagline;

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
}

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
		return await buildSitePayload(ctx, company);
	},
});

// Owner-only preview of the site before (or without) publishing.
export const getSitePreview = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		const company = await ctx.db.get(args.companyId);
		if (!company || company.ownerId !== userId) {
			return null;
		}
		return await buildSitePayload(ctx, company);
	},
});
