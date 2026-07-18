import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";

type ModuleMap = Partial<Record<string, unknown>>;

const asString = (value: unknown): string =>
	typeof value === "string" ? value : "";

// Replace the {company_name} token used throughout module copy.
const withName = (text: string, name: string): string =>
	name ? text.replaceAll("{company_name}", name) : text;

const resolveBrandName = (modules: ModuleMap, fallback: string): string => {
	const nameData = modules.name as
		| Array<{ name?: { name?: string } }>
		| undefined;
	return nameData?.[0]?.name?.name || fallback;
};

const section = (title: string, body: string): string =>
	body.trim() ? `## ${title}\n\n${body.trim()}\n` : "";

const buildMarkdown = (companyName: string, modules: ModuleMap): string => {
	const name = resolveBrandName(modules, companyName);
	const parts: string[] = [`# ${name} — Brand Kit\n`];

	const tagline = asString((modules.tagline as { tagline?: string })?.tagline);
	if (tagline) {
		parts.push(`> ${withName(tagline, name)}\n`);
	}

	parts.push(
		section(
			"Mission",
			withName(
				asString((modules.mission as { mission?: string })?.mission),
				name
			)
		)
	);
	parts.push(
		section(
			"Story",
			withName(asString((modules.story as { story?: string })?.story), name)
		)
	);

	const tone = modules.tone as
		| {
				summary?: string;
				examples?: Array<{ title?: string; description?: string }>;
		  }
		| undefined;
	if (tone) {
		const toneBody = [
			withName(asString(tone.summary), name),
			...(tone.examples ?? []).map(
				(e) =>
					`- **${asString(e.title)}** — ${withName(asString(e.description), name)}`
			),
		]
			.filter(Boolean)
			.join("\n");
		parts.push(section("Voice & Tone", toneBody));
	}

	const colors = modules.colors as
		| {
				overview?: string;
				colors?: Array<{
					name?: string;
					role?: string;
					hex?: string;
					usage?: string;
				}>;
		  }
		| undefined;
	if (colors?.colors?.length) {
		const rows = colors.colors.map(
			(c) =>
				`- \`${asString(c.hex)}\` — **${asString(c.name)}** (${asString(c.role)})${
					c.usage ? ` — ${asString(c.usage)}` : ""
				}`
		);
		parts.push(
			section(
				"Colors",
				[withName(asString(colors.overview), name), ...rows]
					.filter(Boolean)
					.join("\n")
			)
		);
	}

	const type = modules.typography as
		| {
				primaryFont?: { name?: string; usage?: string };
				headlineFont?: { name?: string; usage?: string };
		  }
		| undefined;
	if (type?.primaryFont || type?.headlineFont) {
		const fonts = [
			type.headlineFont?.name
				? `- **Headline:** ${asString(type.headlineFont.name)}${
						type.headlineFont.usage
							? ` — ${asString(type.headlineFont.usage)}`
							: ""
					}`
				: "",
			type.primaryFont?.name
				? `- **Body:** ${asString(type.primaryFont.name)}${
						type.primaryFont.usage
							? ` — ${asString(type.primaryFont.usage)}`
							: ""
					}`
				: "",
		]
			.filter(Boolean)
			.join("\n");
		parts.push(section("Typography", fonts));
	}

	if (modules.logo) {
		parts.push(
			section("Logo", "Editable SVG logo — download from your Brandkite kit.")
		);
	}

	const marketing = modules.marketing as
		| {
				valueProp?: string;
				ads?: Array<{
					angle?: string;
					headline?: string;
					primaryText?: string;
					cta?: string;
				}>;
		  }
		| undefined;
	if (marketing) {
		const mkBody = [
			marketing.valueProp
				? `**${withName(asString(marketing.valueProp), name)}**\n`
				: "",
			...(marketing.ads ?? []).map((ad) =>
				[
					`### ${asString(ad.angle)}`,
					`**${withName(asString(ad.headline), name)}**`,
					withName(asString(ad.primaryText), name),
					`_CTA: ${withName(asString(ad.cta), name)}_`,
				].join("\n\n")
			),
		]
			.filter(Boolean)
			.join("\n\n");
		parts.push(section("Marketing", mkBody));
	}

	const social = modules.social as
		| {
				bios?: Array<{ platform?: string; handle?: string; bio?: string }>;
				posts?: Array<{ hook?: string; body?: string }>;
		  }
		| undefined;
	if (social) {
		const socialBody = [
			...(social.bios ?? []).map(
				(b) =>
					`- **${asString(b.platform)}** (@${asString(b.handle)}): ${withName(asString(b.bio), name)}`
			),
			(social.posts ?? []).length ? "\n**Post ideas:**" : "",
			...(social.posts ?? []).map(
				(p) =>
					`- ${withName(asString(p.hook), name)} — ${withName(asString(p.body), name)}`
			),
		]
			.filter(Boolean)
			.join("\n");
		parts.push(section("Social", socialBody));
	}

	const website = modules.website as
		| {
				hero?: { headline?: string; subheadline?: string };
				features?: Array<{ title?: string; description?: string }>;
				cta?: { headline?: string; buttonText?: string };
		  }
		| undefined;
	if (website) {
		const siteBody = [
			website.hero
				? `**${withName(asString(website.hero.headline), name)}**\n\n${withName(asString(website.hero.subheadline), name)}`
				: "",
			...(website.features ?? []).map(
				(f) =>
					`### ${withName(asString(f.title), name)}\n\n${withName(asString(f.description), name)}`
			),
			website.cta
				? `**${withName(asString(website.cta.headline), name)}** — _${asString(website.cta.buttonText)}_`
				: "",
		]
			.filter(Boolean)
			.join("\n\n");
		parts.push(section("Landing Page", siteBody));
	}

	parts.push("\n---\n_Generated with [Brandkite](https://brandkite.co)_\n");
	return parts.filter(Boolean).join("\n");
};

export const exportBrandMarkdown = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args): Promise<string | null> => {
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

		const modules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.filter((q) => q.eq(q.field("published"), true))
			.collect();

		const map: ModuleMap = {};
		for (const mod of modules as Doc<"brandModules">[]) {
			map[mod.type] = mod.data;
		}

		return buildMarkdown(company.name, map);
	},
});
