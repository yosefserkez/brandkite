import { ConvexError, v } from "convex/values";
import { internalAction } from "./_generated/server";
import { autumn } from "./autumn";
import { logger } from "./logger";

export const checkTrackCredits = internalAction({
	args: {
		companyId: v.id("companies"),
		credits: v.number(),
		deduct: v.optional(v.boolean()),
		throw: v.optional(v.boolean()),
	},
	handler: async (ctx, args): Promise<boolean> => {
		logger.info("LOGGING CREDITS:", { credits: args.credits });
		const { data: creditsData, error: _error } = await autumn.check(ctx, {
			featureId: "credits",
			requiredBalance: args.credits,
		});

		if (!creditsData?.allowed) {
			if (args.throw) {
				throw new ConvexError("Not enough usage credits");
			}
			return false;
		}

		if (args.deduct) {
			await autumn.track(ctx, {
				featureId: "credits",
				value: args.credits,
			});
		}
		return creditsData.allowed;
	},
});
