import { getAuthUserId } from "@convex-dev/auth/server";
import { Autumn } from "@useautumn/convex";
import { components, internal } from "./_generated/api";

export const autumn = new Autumn(components.autumn, {
	secretKey: process.env.AUTUMN_SECRET_KEY ?? "",

	// biome-ignore lint/suspicious/noExplicitAny: ctx is the untyped Autumn identify ctx (an ActionCtx)
	identify: async (ctx: any) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		// identify() runs in an action, which has no ctx.db, so we look up the
		// user's profile via an internal query instead.
		const user = await ctx.runQuery(internal.users.getUserForBilling, {
			userId,
		});

		return {
			customerId: userId,
			customerData: {
				name: user?.name ?? user?.email,
				email: user?.email,
			},
		};
	},
});

/**
 * These exports are required for our react hooks and components
 */

export const {
	track,
	cancel,
	query,
	attach,
	check,
	checkout,
	usage,
	setupPayment,
	createCustomer,
	listProducts,
	billingPortal,
	createReferralCode,
	redeemReferralCode,
	createEntity,
	getEntity,
} = autumn.api();
