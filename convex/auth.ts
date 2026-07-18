import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Resend({
			from: "Brandkite <auth@mail.brandkite.co>",
		}),
		// Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from Convex env. Safe to
		// register even before credentials exist — it only fails if a user
		// actually initiates Google sign-in. The client-side button that
		// triggers this is env-gated (see signInWithMagicLink.tsx) so that
		// never happens until credentials are configured.
		Google,
	],
});
