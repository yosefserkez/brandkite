import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { zodToConvex } from "../lib/zodToConvex";
import { BrandModuleTypes } from "../workflows";

// Reusable Zod schemas
const entitySchema = z.object({
	name: z.string().describe("Name of the entity"),
	summary: z.string().describe("Summary of the entity"),
	url: z
		.string()
		.describe('URL of the entity. Use empty string "" if not available.'),
	imageUrl: z
		.string()
		.describe(
			'URL of the entity\'s image, logo, or icon. This could be from the document, their website, or wikimedia. Use empty string "" if not available.'
		),
});

const teamMemberSchema = entitySchema.extend({
	role: z.string().optional().describe("Role of the team member"),
});

const documentSchema = z.object({
	name: z.string().optional(),
	summary: z.string(),
	url: z.string().optional(),
});

export const brandContextSchema = z.object({
	summary: z
		.string()
		.describe(
			"High-level executive summary of the brand covering its mission, vision, core values, and unique positioning in the market. This should be a comprehensive overview that encapsulates the essence of the brand identity and what makes it distinctive."
		),
	team: z
		.array(teamMemberSchema)
		.optional()
		.describe(
			"Key team members, founders, executives, and stakeholders who drive the brand. Include their names, roles/titles, background summaries, professional URLs (LinkedIn, personal websites), and profile images when available. Focus on individuals who shape the brand's direction and vision."
		),
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
});

export const brandContextValidator = zodToConvex(brandContextSchema);

export type BrandContext = z.infer<typeof brandContextSchema> & {
	documents: BrandDocument[];
};

export type BrandDocument = z.infer<typeof documentSchema>;

export const generateBrandContext = internalAction({
	args: {
		documents: v.array(
			v.object({
				name: v.optional(v.string()),
				summary: v.string(),
				url: v.optional(v.string()),
			})
		),
	},
	handler: async (_ctx, args): Promise<{ brandContext: BrandContext }> => {
		const docsContent = args.documents
			.map((doc: BrandDocument) => doc.summary)
			.join("\n\n");

		const { object } = await generateObject({
			model: openai("gpt-4o"),
			system:
				"You are a business analyst. Extract and structure brand information from the provided content.",
			schema: z.object({ value: brandContextSchema }),
			prompt: docsContent,
			temperature: 0.8,
		});

		return {
			brandContext: {
				...object.value,
				documents: args.documents,
			},
		};
	},
});

export const brandContextWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		documents: v.array(zodToConvex(documentSchema)),
		publish: v.optional(v.boolean()),
	},
	handler: async (step, args): Promise<{ brandContext: BrandContext }> => {
		const { brandContext } = await step.runAction(
			internal.modules.brandContext.generateBrandContext,
			args
		);
		await step.runMutation(internal.brandModules.upsertModuleInternal, {
			companyId: args.companyId,
			type: BrandModuleTypes.BrandContext,
			data: brandContext,
			publish: args.publish ?? true,
		});
		return { brandContext };
	},
});
