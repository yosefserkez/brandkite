import { ConvexAuthProvider } from "@convex-dev/auth/react";
import {
	ErrorBoundary,
	wrapCreateRootRouteWithSentry,
} from "@sentry/tanstackstart-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import StoreDevtools from "../lib/demo-store-devtools";
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
				title: "TanStack Start Starter",
			},
		],
		links: [
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
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexAuthProvider client={convex}>
					<ErrorBoundary fallback={ErrorFallback}>{children}</ErrorBoundary>
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							StoreDevtools,
							TanStackQueryDevtools,
						]}
					/>
				</ConvexAuthProvider>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}
