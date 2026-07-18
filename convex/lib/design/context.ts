import type { BrandContext } from "../../modules/brandContext";

// Shared brand-kit prompt block. Every module that composes from siblings
// renders the same structure so generations stay mutually consistent.
export type BrandKitBlockArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
	tagline?: string | null;
	mission?: string | null;
	story?: string | null;
};

export const brandKitBlock = ({
	brandContext,
	tagline,
	mission,
	story,
}: BrandKitBlockArgs): string =>
	[
		"Brand kit to stay consistent with:",
		tagline ? `- Tagline: "${tagline}"` : "",
		mission ? `- Mission: ${mission}` : "",
		story ? `- Story: ${story}` : "",
		`- What the brand is: ${brandContext.summary}`,
		`- Who it serves: ${brandContext.customer.summary}`,
		`- Product: ${brandContext.product.summary}`,
		`- Brand voice: ${brandContext.brand.summary}`,
		`- Industry: ${brandContext.industry ?? "Unspecified"}`,
	]
		.filter(Boolean)
		.join("\n");

export const inspirationLines = (brandContext: BrandContext): string =>
	brandContext.brand.inspirations
		.map((inspiration) => `- ${inspiration.name}: ${inspiration.summary}`)
		.join("\n");

export const competitorLines = (brandContext: BrandContext): string =>
	brandContext.market.competitors
		.map((competitor) => `- ${competitor.name}: ${competitor.summary}`)
		.join("\n");

// The brand's own signals that make output specific to THIS brand rather than
// its category: inspirations to nod toward, competitors to diverge from.
export const distinctivenessBlock = (brandContext: BrandContext): string => {
	const inspirations = inspirationLines(brandContext);
	const competitors = competitorLines(brandContext);
	return [
		inspirations
			? ["Inspirations to nod toward (never copy):", inspirations].join("\n")
			: "",
		competitors
			? [
					"Competitors — actively diverge from how these sound and look:",
					competitors,
				].join("\n")
			: "",
	]
		.filter(Boolean)
		.join("\n\n");
};

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Replace the literal brand name with the {company_name} token so stored copy
// survives renames. Previously duplicated across five modules.
export const tokenizeBrandName = (
	value: string,
	companyName?: string | null
): string => {
	const trimmed = value.trim();
	if (!companyName) {
		return trimmed;
	}
	const pattern = new RegExp(`\\b${escapeRegExp(companyName)}\\b`, "gi");
	return trimmed.replace(pattern, "{company_name}");
};
