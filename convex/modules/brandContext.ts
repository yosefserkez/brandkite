import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { generateObject } from "ai";
import type { Infer } from "convex/values";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { BrandModuleTypes } from "../workflows";

type WorkflowHandlerParams = Parameters<
	Parameters<(typeof workflow)["define"]>[0]["handler"]
>;
type WorkflowContext = WorkflowHandlerParams[0];
type WorkflowArgs = WorkflowHandlerParams[1];

// Reusable Convex validators
const entityValidator = v.object({
	name: v.optional(v.string()),
	summary: v.optional(v.string()),
	url: v.string(),
	imageUrl: v.optional(v.string()),
});

const teamMemberValidator = v.object({
	name: v.optional(v.string()),
	summary: v.optional(v.string()),
	url: v.string(),
	imageUrl: v.optional(v.string()),
	role: v.optional(v.string()),
});

const documentValidator = v.object({
	name: v.optional(v.string()),
	summary: v.string(),
	url: v.optional(v.string()),
});

export const brandContextValidator = v.object({
	industry: v.optional(v.string()),
	summary: v.string(),
	team: v.optional(
		v.object({
			summary: v.string(),
			members: v.array(teamMemberValidator),
		})
	),
	product: v.object({
		summary: v.string(),
	}),
	market: v.object({
		summary: v.string(),
		competitors: v.array(entityValidator),
	}),
	customer: v.object({
		summary: v.string(),
	}),
	brand: v.object({
		summary: v.string(),
		inspirations: v.array(entityValidator),
	}),
	business: v.object({
		summary: v.string(),
	}),
	documents: v.array(documentValidator),
});

// Zod schema for AI generation (keeping this for generateObject compatibility)
const entitySchema = z.object({
	name: z
		.string()
		.optional()
		.describe("Name of the entity if provided, otherwise leave blank"),
	summary: z.string().optional().describe("Summary of the entity"),
	url: z.string().describe("URL of the related entity."),
	imageUrl: z
		.string()
		.optional()
		.describe(
			'URL of the entity\'s image, logo, or icon. This could be from the document, their website, or wikimedia. Use empty string "" if not available.'
		),
});

const teamMemberSchema = entitySchema.extend({
	role: z.string().optional().describe("Role of the team member"),
	summary: z.string().optional().describe("Summary of the team member"),
});

export const brandContextSchema = z
	.object({
		industry: z.string().optional().describe("Industry of the brand"),
		summary: z
			.string()
			.describe(
				"High-level executive summary of the brand covering its mission, vision, core values, and unique positioning in the market. This should be a comprehensive overview that encapsulates the essence of the brand identity and what makes it distinctive."
			),
		team: z
			.object({
				summary: z
					.string()
					.optional()
					.describe(
						"Summary of the team extracted from the documents. Leave blank if no team information is found."
					),
				members: z
					.array(teamMemberSchema)
					.optional()
					.describe(
						"Key team members, founders, executives, and stakeholders who drive the brand extracted from the documents."
					),
			})
			.optional()
			.describe("Team information extracted from the documents"),
		product: z
			.object({
				summary: z
					.string()
					.describe(
						"Detailed description of the product or service offering. Include what the product does, its key features and benefits, the problems it solves, unique value propositions, differentiators from alternatives, current stage of development (concept/MVP/launched/mature), and any notable technical or innovative aspects."
					),
			})
			.describe("Product or service offering information"),
		market: z
			.object({
				summary: z
					.string()
					.describe(
						"Comprehensive market analysis including: target market size and growth potential, market segments and verticals being addressed, current market trends and dynamics, opportunities and threats, regulatory environment if relevant, geographic focus (local/regional/global), and market maturity stage. Provide data-driven insights when available."
					),
				competitors: z
					.array(entitySchema)
					.describe(
						"List the top 3 most relevant competitors. For each competitor, include a brief description of their offering, market positioning, strengths and weaknesses."
					),
			})
			.describe("Market environment and competitive landscape"),
		customer: z
			.object({
				summary: z
					.string()
					.describe(
						"Detailed customer/user profile including: target audience demographics (age, location, income, education), psychographics (values, interests, behaviors), pain points and needs being addressed, current solutions they use, decision-making criteria, buying behaviors, and customer segments if applicable. Paint a clear picture of who the ideal customer is."
					),
			})
			.describe("Target customer and user profile"),
		brand: z.object({
			summary: z
				.string()
				.describe(
					"Brand aesthetic, identity and personality description including: brand voice and tone, visual identity characteristics, brand personality traits, emotional associations, brand story and narrative, key messaging pillars, brand promise, and how the brand wants to be perceived. This captures the intangible aesthetic and personality aspects of the brand beyond product features."
				),
			inspirations: z
				.array(entitySchema)
				.describe(
					"List the top 3 brands whose brand identity and aesthetics should inspire this brand's aesthetics. For each inspiration, include a brief description of what makes them inspirational. It does not need to be a related, but should be based on the rest of the brand context."
				),
		}),
		business: z
			.object({
				summary: z
					.string()
					.describe(
						"Business model and go-to-market strategy including: revenue model (subscription, one-time, freemium, etc.), pricing strategy, sales channels and distribution approach, customer acquisition strategy, key partnerships and alliances, unit economics if known, growth strategy and milestones, funding status and runway if applicable. Explain how the business creates, delivers, and captures value."
					),
			})
			.describe("Business model, strategy, and commercial approach"),
	})
	.describe("Structured brand context output,");

type GeneratedBrandContext = z.infer<typeof brandContextSchema>;

export type BrandContext = Infer<typeof brandContextValidator>;

export type BrandDocument = Infer<typeof documentValidator>;

const MODEL_NAME = "x-ai/grok-4-fast";
const SYSTEM_PROMPT =
	"You are a business analyst. Extract and structure brand information from the provided content. Keep the responses concise and to the point, no longer than 2 sentences.";

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const buildDocsContent = (documents: BrandDocument[]): string =>
	documents.map((doc: BrandDocument) => doc.summary).join("\n\n");

const normalizeBrandContext = (
	context: GeneratedBrandContext,
	documents: BrandDocument[]
): BrandContext => {
	const team = context.team
		? {
				summary: context.team.summary ?? "",
				members: context.team.members ?? [],
			}
		: undefined;

	return {
		...context,
		team,
		documents,
	};
};

export const generateBrandContext = internalAction({
	args: {
		documents: v.array(documentValidator),
	},
	handler: async (_ctx, args): Promise<{ brandContext: BrandContext }> => {
		const docsContent = buildDocsContent(args.documents);
		const { object } = await generateObject({
			model: openrouter.chat(MODEL_NAME),
			system: SYSTEM_PROMPT,
			schema: z.object({ value: brandContextSchema }),
			prompt: docsContent,
			temperature: 0.8,
		});
		const brandContext = normalizeBrandContext(object.value, args.documents);
		return {
			brandContext,
		};
	},
});

export const brandContextWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		documents: v.array(documentValidator),
		publish: v.optional(v.boolean()),
	},
	handler: async (
		ctx: WorkflowContext,
		args: WorkflowArgs
	): Promise<{ brandContext: BrandContext }> => {
		const { brandContext } = await ctx.runAction(
			internal.modules.brandContext.generateBrandContext,
			{ documents: args.documents }
		);
		await ctx.runMutation(internal.brandModules.upsertModuleByTypeInternal, {
			companyId: args.companyId,
			type: BrandModuleTypes.BrandContext,
			data: brandContext,
			publish: args.publish ?? true,
		});
		return { brandContext };
	},
});
