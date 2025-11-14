import { Autumn } from "@useautumn/convex";
import { components } from "./_generated/api";

export const autumn = new Autumn(components.autumn, {
	secretKey: process.env.AUTUMN_SECRET_KEY ?? "",

	// biome-ignore lint/suspicious/noExplicitAny: ctx is not typed
	identify: async (ctx: any) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) {
			return null;
		}

		const userId = user.subject.split("|")[0];
		return {
			customerId: userId,
			customerData: {
				name: user.name as string,
				email: user.email as string,
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
