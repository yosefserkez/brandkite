import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import type { Infer } from "convex/values";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { logger } from "../logger";
import { BrandModuleTypes } from "../workflows";
import type { BrandContext } from "./brandContext";

// Domain availability configuration
export type DomainCheckOptions = {
	tlds?: string[]; // TLDs to check, e.g., ['com', 'io', 'ai', 'co']
	variants?: {
		prefixes?: string[]; // e.g., ['get', 'try', 'use', 'my']
		suffixes?: string[]; // e.g., ['app', 'hq', 'labs', 'io']
	};
	maxResults?: number; // Maximum number of available domains to return
};

export type DomainAvailabilityResult = {
	domain: string;
	available: boolean;
	checked: boolean; // Whether the check was successful
	error?: string;
};

const DEFAULT_TLDS = ["com", "io", "ai", "co", "app"];

// DNS Status codes from Google DNS API
const DNS_STATUS_NXDOMAIN = 3; // Domain doesn't exist (likely available)

// Reusable Convex validators
export const nameValidator = v.object({
	name: v.string(),
	reasoning: v.string(),
});

// Zod schema for AI generation (keeping this for generateObject compatibility)
export const nameSchema = z.object({
	name: z
		.string()
		.describe(
			"The primary recommended brand name. Should be memorable, distinctive, and aligned with the brand's values and positioning."
		),
	reasoning: z
		.string()
		.describe(
			"Detailed explanation of why this name was chosen, including how it reflects the brand context, target audience, and market positioning."
		),
});

export type Name = Infer<typeof nameValidator>;

/**
 * Normalizes a name for domain usage by removing special characters and spaces
 */
function normalizeDomainName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "") // Remove special chars except hyphens
		.replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
		.replace(/--+/g, "-"); // Replace multiple hyphens with single
}

/**
 * Generates domain variants based on the name and options
 */
function generateDomainVariants(
	name: string,
	options: DomainCheckOptions = {}
): string[] {
	const normalizedName = normalizeDomainName(name);
	const tlds = options.tlds || DEFAULT_TLDS;
	const prefixes = options.variants?.prefixes || [];
	const suffixes = options.variants?.suffixes || [];

	const domains: string[] = [];

	// Base domain with each TLD
	for (const tld of tlds) {
		domains.push(`${normalizedName}.${tld}`);
	}

	// Prefix variants
	for (const prefix of prefixes) {
		const normalizedPrefix = normalizeDomainName(prefix);
		for (const tld of tlds) {
			domains.push(`${normalizedPrefix}${normalizedName}.${tld}`);
		}
	}

	// Suffix variants
	for (const suffix of suffixes) {
		const normalizedSuffix = normalizeDomainName(suffix);
		for (const tld of tlds) {
			domains.push(`${normalizedName}${normalizedSuffix}.${tld}`);
		}
	}

	return domains;
}

/**
 * Checks if a single domain is available using DNS lookup
 * Note: This is a basic check. For production, consider using a dedicated domain availability API
 */
async function checkDomain(domain: string): Promise<DomainAvailabilityResult> {
	try {
		// Using DNS lookup to check if domain exists
		// This is done by attempting to resolve the domain
		const response = await fetch(
			`https://dns.google/resolve?name=${domain}&type=A`
		);

		if (!response.ok) {
			return {
				domain,
				available: false,
				checked: false,
				error: "DNS lookup failed",
			};
		}

		const data = await response.json();

		// If status is NXDOMAIN (3), the domain doesn't exist (likely available)
		// If status is NOERROR (0), the domain exists (not available)
		const available = data.Status === DNS_STATUS_NXDOMAIN;

		logger.info("Domain availability check result", {
			domain,
			data,
			available,
		});

		return {
			domain,
			available,
			checked: true,
		};
	} catch (error) {
		return {
			domain,
			available: false,
			checked: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export const generateNames = internalAction({
	args: {
		companyId: v.id("companies"),
		contextContent: v.string(),
	},
	handler: async (_ctx, args): Promise<{ names: Name[] }> => {
		const openrouter = createOpenRouter({
			apiKey: process.env.OPENROUTER_API_KEY,
		});
		const { object } = await generateObject({
			model: openrouter.chat("google/gemini-2.5-flash-lite-preview-09-2025"),
			system:
				"You are a creative brand naming expert. Generate compelling, memorable brand names based on the provided brand context. Consider linguistics, market appeal, memorability, and brand alignment.",
			schema: z.array(z.object({ value: nameSchema })),
			prompt: `Generate 20 compelling brand name options and their reasoning based on this brand context:\n\n${args.contextContent}`,
			temperature: 0.9,
		});

		return { names: object.map((o) => o.value) };
	},
});

export const generateDomains = internalAction({
	args: {
		name: v.string(),
		options: v.optional(
			v.object({
				tlds: v.optional(v.array(v.string())),
				variants: v.optional(
					v.object({
						prefixes: v.optional(v.array(v.string())),
						suffixes: v.optional(v.array(v.string())),
					})
				),
				maxResults: v.optional(v.number()),
			})
		),
	},
	handler: async (_ctx, args) => {
		const variants = generateDomainVariants(args.name, args.options);
		const maxResults = args.options?.maxResults || 10;

		// Check domains in parallel with batching to avoid overwhelming the DNS service
		const batchSize = 10;
		const availableDomains: string[] = [];

		for (
			let i = 0;
			i < variants.length && availableDomains.length < maxResults;
			i += batchSize
		) {
			const batch = variants.slice(i, i + batchSize);

			const results = await Promise.all(batch.map(checkDomain));

			logger.info("Results", { results });
			for (const result of results) {
				if (result.available && result.checked) {
					availableDomains.push(result.domain);
					if (availableDomains.length >= maxResults) {
						break;
					}
				}
			}
		}

		return availableDomains;
	},
});

export const nameWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<{ name: Name; domains: string[] }[]> => {
		// Wait for brandContext to be available

		const brandContextModule = await ctx.runQuery(
			internal.brandModules.getPublishedModules,
			{
				companyId: args.companyId,
				types: [BrandModuleTypes.BrandContext],
			}
		);

		// TODO:If brandContext doesn't exist, wait

		const brandContext = brandContextModule[BrandModuleTypes.BrandContext]
			?.data as BrandContext;

		if (!brandContext) {
			throw new Error("Brand context data is invalid");
		}

		// create module with generation status in progress
		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Name,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const namesWithDomainAvailability: { name: Name; domains: string[] }[] = [];
		const MAX_NAMES = 5;
		const MAX_TRIES = 1;
		let triesLeft = MAX_TRIES;

		// Configure domain checking options
		const domainCheckOptions: DomainCheckOptions = {
			tlds: ["com", "io", "ai", "co", "app", "net"],
			variants: {
				prefixes: ["get", "try", "use", "my", "with"],
				suffixes: ["app", "hq", "labs", "io"],
			},
			maxResults: 5, // Return up to 5 available domains per name
		};

		while (namesWithDomainAvailability.length < MAX_NAMES && triesLeft > 0) {
			const { names } = await ctx.runAction(
				internal.modules.name.generateNames,
				{
					companyId: args.companyId,
					contextContent: brandContext.summary,
				}
			);

			const namesWithDomains = await Promise.all(
				names.map(async (name: Name) => {
					const domains = await ctx.runAction(
						internal.modules.name.generateDomains,
						{
							name: name.name,
							options: domainCheckOptions,
						}
					);
					return { name, domains };
				})
			);

			// Only add names that have at least one available domain
			const validNames = namesWithDomains.filter(
				(item) => item.domains.length > 0
			);

			namesWithDomainAvailability.push(...validNames);
			triesLeft -= 1;
		}

		const data = namesWithDomainAvailability;

		// Save the name as a module
		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return data;
	},
});
