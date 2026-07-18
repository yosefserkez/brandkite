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
import { ConvexReactClient } from "convex/react";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "sonner";
import { AutumnWrapper } from "../components/autumn-wrapper";
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
				title: "Brandkite",
			},
		],
		links: [
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

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" style={{ colorScheme: "light" }}>
			<head>
				<HeadContent />
				<script
					data-website-id="3ada9b6d-43ca-45a1-ac9c-e4c4b40f5857"
					defer
					src="https://cloud.umami.is/script.js"
				/>
			</head>
			<body>
				<PostHogProvider
					apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN}
					options={{
						api_host: "/ingest",
						ui_host:
							import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
							"https://us.posthog.com",
						defaults: "2025-05-24",
						capture_exceptions: true,
						debug: import.meta.env.DEV,
					}}
				>
					<ConvexAuthProvider client={convex}>
						<ErrorBoundary>
							<AutumnWrapper>{children}</AutumnWrapper>
						</ErrorBoundary>
					</ConvexAuthProvider>
					<Toaster />
					<Scripts />
				</PostHogProvider>
			</body>
		</html>
	);
}
