import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
	action,
	internalAction,
	internalMutation,
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

export const listWithBrandData = query({
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

		// Fetch brand modules for each company
		const companiesWithBrandData = await Promise.all(
			uniqueCompanies.map(async (company) => {
				// Get name module
				const nameModule = await ctx.db
					.query("brandModules")
					.withIndex("by_company_type", (q) =>
						q.eq("companyId", company._id).eq("type", BrandModuleTypes.Name)
					)
					.filter((q) => q.eq(q.field("published"), true))
					.first();

				// Get logo module
				const logoModule = await ctx.db
					.query("brandModules")
					.withIndex("by_company_type", (q) =>
						q.eq("companyId", company._id).eq("type", BrandModuleTypes.Logo)
					)
					.filter((q) => q.eq(q.field("published"), true))
					.first();

				// Get brand context module
				const brandContextModule = await ctx.db
					.query("brandModules")
					.withIndex("by_company_type", (q) =>
						q
							.eq("companyId", company._id)
							.eq("type", BrandModuleTypes.BrandContext)
					)
					.filter((q) => q.eq(q.field("published"), true))
					.first();

				return {
					...company,
					nameModule: nameModule?.data,
					logoModule: logoModule?.data,
					brandContextModule: brandContextModule?.data,
				};
			})
		);

		return companiesWithBrandData;
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

export const updateInternal = internalMutation({
	args: {
		companyId: v.id("companies"),
		name: v.optional(v.string()),
		isPublic: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.companyId, {
			name: args.name ?? undefined,
			isPublic: args.isPublic ?? undefined,
			updatedAt: Date.now(),
		});
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

		await ctx.runMutation(internal.companies.updateInternal, {
			companyId: args.companyId,
			name: args.name,
			isPublic: args.isPublic,
		});
	},
});

export const deleteCompany = mutation({
	args: {
		companyId: v.id("companies"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const company = await ctx.db.get(args.companyId);
		if (!company) {
			throw new Error("Company not found");
		}

		// Only the owner can delete the company
		if (company.ownerId !== userId) {
			throw new Error(
				"Not authorized - only the owner can delete this company"
			);
		}

		// Delete all brand modules associated with this company
		const brandModules = await ctx.db
			.query("brandModules")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect();

		for (const module of brandModules) {
			await ctx.db.delete(module._id);
		}

		// Delete all company memberships
		const memberships = await ctx.db
			.query("companyMembers")
			.withIndex("by_company", (q) => q.eq("companyId", args.companyId))
			.collect();

		for (const membership of memberships) {
			await ctx.db.delete(membership._id);
		}

		// Finally, delete the company
		await ctx.db.delete(args.companyId);
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
