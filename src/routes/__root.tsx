import { ConvexAuthProvider } from "@convex-dev/auth/react";
import {
	ErrorBoundary,
	wrapCreateRootRouteWithSentry,
} from "@sentry/tanstackstart-react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { Toaster } from "sonner";
import { api } from "../../convex/_generated/api";
import { AutumnWrapper } from "../components/autumn-wrapper";
import { identifyUser, initAnalytics, resetAnalytics } from "../lib/analytics";
import appCss from "../styles.css?url";

type MyRouterContext = {
	queryClient: QueryClient;
};

const createRootRoute = wrapCreateRootRouteWithSentry(
	createRootRouteWithContext<MyRouterContext>()
);

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Brandkite — complete AI brand kits in minutes",
			},
			{
				name: "description",
				content:
					"Generate a complete, client-ready brand identity from a URL or a sentence: name, tagline, story, tone, colors, typography, and an editable SVG logo — not just a logo, the whole kit.",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "Brandkite" },
			{
				property: "og:title",
				content: "Brandkite — complete AI brand kits in minutes",
			},
			{
				property: "og:description",
				content:
					"Generate a complete, client-ready brand identity from a URL or a sentence — strategy, voice, colors, typography, and logo in one editable kit.",
			},
			{ property: "og:url", content: "https://brandkite.co" },
			{ property: "og:image", content: "https://brandkite.co/billboard.png" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: "Brandkite — complete AI brand kits in minutes",
			},
			{
				name: "twitter:description",
				content:
					"A complete, client-ready brand identity in minutes — not a logo, the whole kit.",
			},
			{ name: "twitter:image", content: "https://brandkite.co/billboard.png" },
		],
		links: [
			{ rel: "icon", href: "/favicon.ico", sizes: "48x48" },
			{
				rel: "icon",
				href: "/favicon-32x32.png",
				type: "image/png",
				sizes: "32x32",
			},
			{ rel: "apple-touch-icon", href: "/apple-icon-180x180.png" },
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Caveat:wght@400..700&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
});

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const ErrorFallback = () => (
	<div
		className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center"
		role="alert"
	>
		<h1 className="font-semibold text-xl">Something went wrong</h1>
		<p>Please refresh the page. If the issue persists, contact support.</p>
	</div>
);

function AnalyticsIdentity() {
	const { isAuthenticated } = useConvexAuth();
	const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

	useEffect(() => {
		initAnalytics();
	}, []);

	const wasAuthenticated = useRef(false);
	useEffect(() => {
		if (isAuthenticated && viewer) {
			identifyUser(viewer._id, viewer.email);
			wasAuthenticated.current = true;
		} else if (!isAuthenticated && wasAuthenticated.current) {
			// Only reset on a real logout — resetting anonymous visitors would
			// mint a new distinct_id on every page load.
			resetAnalytics();
			wasAuthenticated.current = false;
		}
	}, [isAuthenticated, viewer]);

	return null;
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" style={{ colorScheme: "light" }}>
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexAuthProvider client={convex}>
					<AnalyticsIdentity />
					<ErrorBoundary fallback={<ErrorFallback />}>
						<AutumnWrapper>{children}</AutumnWrapper>
					</ErrorBoundary>
				</ConvexAuthProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
