import { v } from "convex/values";
import z from "zod";
import { workflow } from "..";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { copyChecks } from "../lib/design/checks";
import { tokenizeBrandName } from "../lib/design/context";
import { generateChecked } from "../lib/design/generate";
import { textModel } from "../lib/design/models";
import { COPY_CRAFT, composeSystem } from "../lib/design/skills";
import { BrandModuleTypes } from "../workflows";
import { type BrandContext, brandContextValidator } from "./brandContext";

const SYSTEM_PROMPT = composeSystem(
	"You are a seasoned brand strategist. Write concise, conviction-filled mission statements that ground lofty aspirations in practical commitments. Avoid jargon and keep the language human, active, and believable.",
	COPY_CRAFT
);
const TEMPERATURE = 0.6;

const MIN_MISSION_LENGTH = 12;

export const missionSchema = z.object({
	mission: z
		.string()
		.min(MIN_MISSION_LENGTH)
		.describe(
			"Single-sentence brand mission statement written in first person plural. Use the literal token {company_name} when referencing the company."
		),
});

export type BrandMission = z.infer<typeof missionSchema>;

export const missionValidator = v.object({
	mission: v.string(),
});

type BuildMissionPromptArgs = {
	brandContext: BrandContext;
	companyName?: string | null;
};

const buildMissionPrompt = ({
	brandContext,
	companyName,
}: BuildMissionPromptArgs): string => {
	const inspirationLines = brandContext.brand.inspirations
		.map(
			(inspiration) =>
				`- ${inspiration.name}: ${inspiration.summary} (Source: ${inspiration.url})`
		)
		.join("\n");

	return [
		`Brand name for context: ${companyName ?? "Unnamed brand"}`,
		"Use the literal token {company_name} whenever you reference the company. Never output the actual brand name.",
		"",
		"Brand context essentials:",
		`- Summary: ${brandContext.summary}`,
		`- Industry: ${brandContext.industry ?? "Unspecified"}`,
		`- Customer: ${brandContext.customer.summary}`,
		`- Product: ${brandContext.product.summary}`,
		`- Market: ${brandContext.market.summary}`,
		`- Brand voice: ${brandContext.brand.summary}`,
		`- Business model: ${brandContext.business.summary}`,
		brandContext.team
			? `- Team: ${brandContext.team.summary ?? "Team details available"}`
			: "- Team: Not described",
		inspirationLines
			? ["", "Brand inspirations to nod toward:", inspirationLines].join("\n")
			: "",
		"",
		"Write one mission statement that:",
		"- Starts with an active verb and speaks from the voice of {company_name}.",
		"- Names the core audience and the transformation promised.",
		"- Grounds the mission in how the company uniquely delivers value today.",
		"- Fits on two lines or fewer (around 20-30 words).",
		"",
		"Respond with JSON satisfying the provided schema.",
	].join("\n");
};

const normalizeMission = (
	mission: BrandMission,
	companyName?: string | null
): BrandMission => ({
	mission: tokenizeBrandName(mission.mission, companyName),
});

export const generateMission = internalAction({
	args: {
		companyId: v.id("companies"),
		brandContext: brandContextValidator,
		companyName: v.optional(v.string()),
	},
	handler: async (_ctx, args): Promise<{ mission: BrandMission }> => {
		const prompt = buildMissionPrompt({
			brandContext: args.brandContext as BrandContext,
			companyName: args.companyName ?? undefined,
		});

		const raw = await generateChecked({
			model: textModel(),
			system: SYSTEM_PROMPT,
			prompt,
			temperature: TEMPERATURE,
			schema: missionSchema,
			check: (value) => copyChecks(value, prompt),
			label: "mission",
		});

		return {
			mission: normalizeMission(raw, args.companyName ?? undefined),
		};
	},
});

export const missionWorkflow = workflow.define({
	args: {
		companyId: v.id("companies"),
		publish: v.optional(v.boolean()),
		options: v.optional(v.record(v.string(), v.string())),
	},
	handler: async (ctx, args): Promise<BrandMission> => {
		const brandContextDoc = (
			await ctx.runQuery(internal.brandModules.getCurrentModule, {
				companyId: args.companyId,
				type: BrandModuleTypes.BrandContext,
			})
		)?.data as BrandContext | null;

		if (!brandContextDoc) {
			throw new Error("Brand context data is invalid");
		}

		const company = await ctx.runQuery(internal.companies.getForGeneration, {
			companyId: args.companyId,
		});

		const moduleId = await ctx.runMutation(
			internal.brandModules.createModuleInternal,
			{
				companyId: args.companyId,
				type: BrandModuleTypes.Mission,
				publish: false,
				generationStatus: "in_progress",
			}
		);

		const { mission } = await ctx.runAction(
			internal.modules.mission.generateMission,
			{
				companyId: args.companyId,
				brandContext: brandContextDoc,
				companyName: company?.name ?? undefined,
			}
		);

		await ctx.runMutation(internal.brandModules.updateModuleInternal, {
			moduleId,
			data: mission,
			publish: args.publish ?? true,
			generationStatus: "succeeded",
		});

		return mission;
	},
});
