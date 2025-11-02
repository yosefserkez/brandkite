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
import { companySummaryFormat, scrape } from "./lib/firecrawl";
import {
	type BrandContext,
	type BrandDocument,
	brandContextValidator,
} from "./modules/brandContext";
import { brandModuleTypeValidator } from "./workflows";

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
		contextModuleData: v.optional(
			v.array(
				v.object({
					type: brandModuleTypeValidator,
					data: v.any(),
				})
			)
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const now = Date.now();

		// create  company with name if provided
		const companyId = await ctx.db.insert("companies", {
			name: args.name,
			description: args.description, // TODO:remove this field from schema
			ownerId: userId,
			isPublic: args.isPublic ?? false,
			createdAt: now,
			updatedAt: now,
		});

		// Generate context modules first (team, customer, product, market, etc.), then brand modules
		// we should have the context modules
		if (args.contextModuleData) {
			for (const module of args.contextModuleData) {
				await ctx.runMutation(internal.brandModules.upsertModuleInternal, {
					companyId,
					type: module.type,
					data: module.data,
					publish: true,
				});
			}
		}

		// generate name
		// await workflow.start(ctx, internal.modules.name.nameWorkflow, {
		// 	companyId,
		// 	inputContent: "test input content",
		// });

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
		rawText: v.optional(v.string()),
	},
	returns: brandContextValidator,
	handler: async (ctx, args): Promise<BrandContext> => {
		const documents: BrandDocument[] = [];

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
