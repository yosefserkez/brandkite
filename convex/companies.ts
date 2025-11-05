import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
	action,
	internalAction,
	internalQuery,
	mutation,
	query,
} from "./_generated/server";
import { workflow } from "./index";
import { companySummaryFormat, scrape } from "./lib/firecrawl";
import { logger } from "./logger";
import {
	type BrandContext,
	type BrandDocument,
	brandContextValidator,
} from "./modules/brandContext";
import { BrandModuleTypes } from "./workflows";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get companies where user is owner or member
		const ownedCompanies = await ctx.db
			.query("companies")
			.withIndex("by_owner", (q) => q.eq("ownerId", userId))
			.collect();

		const memberCompanies = await ctx.db
			.query("companyMembers")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const memberCompanyIds = memberCompanies.map((m) => m.companyId);
		const memberCompanyData = await Promise.all(
			memberCompanyIds.map((id) => ctx.db.get(id))
		);

		const allCompanies = [
			...ownedCompanies,
			...memberCompanyData.filter(
				(c): c is NonNullable<typeof c> => c !== null
			),
		];

		// Remove duplicates and sort by updatedAt
		const uniqueCompanies = allCompanies
			.filter(
				(company, index, self) =>
					self.findIndex((c) => c._id === company._id) === index
			)
			.sort((a, b) => b.updatedAt - a.updatedAt);

		return uniqueCompanies;
	},
});

export const get = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			return null;
		}

		// Check if user has access
		if (company.ownerId === userId) {
			return company;
		}
		if (company.isPublic) {
			return company;
		}

		const membership = await ctx.db
			.query("companyMembers")
			.withIndex("by_company_user", (q) =>
				q.eq("companyId", args.companyId).eq("userId", userId)
			)
			.first();

		return membership ? company : null;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		isPublic: v.boolean(),
		brandContext: brandContextValidator,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const now = Date.now();

		// create  company with name if provided
		const companyId = await ctx.db.insert("companies", {
			name: args.name, // TODO: remove this field from schema
			description: args.description, // TODO:remove this field from schema
			ownerId: userId,
			isPublic: args.isPublic ?? false,
			createdAt: now,
			updatedAt: now,
		});

		// we should have the context modules
		if (args.brandContext) {
			await ctx.runMutation(internal.brandModules.createModuleInternal, {
				companyId,
				type: BrandModuleTypes.BrandContext,
				data: args.brandContext as BrandContext,
				publish: true,
			});
		}

		workflow.start(ctx, internal.modules.name.nameWorkflow, {
			companyId,
			publish: true,
		});

		return companyId;
	},
});

export const update = mutation({
	args: {
		companyId: v.id("companies"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const company = await ctx.db.get(args.companyId);
		if (!company || company.ownerId !== userId) {
			throw new Error("Not authorized");
		}

		const updates: {
			updatedAt: number;
			name?: string;
			description?: string;
			isPublic?: boolean;
		} = { updatedAt: Date.now() };
		if (args.name !== undefined) {
			updates.name = args.name;
		}
		if (args.description !== undefined) {
			updates.description = args.description;
		}
		if (args.isPublic !== undefined) {
			updates.isPublic = args.isPublic;
		}

		await ctx.db.patch(args.companyId, updates);
	},
});

export const getForGeneration = internalQuery({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => ctx.db.get(args.companyId),
});

export const processBrandInput = action({
	args: {
		urls: v.optional(v.array(v.string())),
		files: v.optional(
			v.array(
				v.object({
					name: v.string(),
					text: v.string(),
				})
			)
		),
		rawText: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<BrandContext> =>
		await ctx.runAction(internal.companies.processBrandInputInternal, {
			urls: args.urls,
			rawText: args.rawText,
		}),
});

export const processBrandInputInternal = internalAction({
	args: {
		urls: v.optional(v.array(v.string())),
		files: v.optional(
			v.array(
				v.object({
					name: v.string(),
					text: v.string(),
				})
			)
		),
		rawText: v.optional(v.string()),
	},
	returns: brandContextValidator,
	handler: async (ctx, args): Promise<BrandContext> => {
		const documents: BrandDocument[] = [];

		logger.info("Processing brand input", {
			urls: args.urls,
			files: args.files,
			rawText: args.rawText,
		});
		// Process URLs with Firecrawl
		if (args.urls && args.urls.length > 0) {
			for (const url of args.urls) {
				const response = await scrape(url, ["summary", companySummaryFormat]); // we can use companySummaryFormat when we want to seed the brand context with more detailed information
				if (response.success) {
					const completeSummary = `${response.data?.summary ?? ""}\n\n${JSON.stringify(response.data?.json ?? {})}`;
					documents.push({
						name: url,
						summary: completeSummary,
						url,
					});
				}
			}
		}

		// Add raw text as a document if present
		if (args.rawText) {
			documents.push({
				name: "User Input",
				summary: args.rawText,
			});
		}
		if (args.files && args.files.length > 0) {
			for (const file of args.files) {
				documents.push({
					name: file.name,
					summary: `File content: ${file.text}`,
				});
			}
		}

		// Call brandContext workflow with documents
		const brandContextResult = await ctx.runAction(
			internal.modules.brandContext.generateBrandContext,
			{
				documents,
			}
		);

		return brandContextResult.brandContext;
	},
});
