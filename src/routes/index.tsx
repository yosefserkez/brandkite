import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/")({
	component: IndexRoute,
});

function IndexRoute() {
	return (
		<div className="flex min-h-screen bg-gray-50">
			<Authenticated>
				<SidebarProvider
					style={
						{
							"--sidebar-width": "calc(var(--spacing) * 72)",
							"--header-height": "calc(var(--spacing) * 12)",
						} as React.CSSProperties
					}
				>
					<AppSidebar variant="inset" />
					<SidebarInset>
						<div className="flex flex-1 flex-col">
							<main className="flex-1 overflow-hidden">
								<div className="flex h-full items-center justify-center">
									<div className="text-center">
										<h2 className="mb-2 font-semibold text-2xl text-gray-900">
											Select a company to get started
										</h2>
										<p className="text-gray-600">
											Choose a company from the sidebar or{" "}
											<Link
												className="text-primary underline-offset-2 hover:text-primary/80"
												to="/c/new"
											>
												Create a New Company
											</Link>
										</p>
									</div>
								</div>
							</main>
						</div>
					</SidebarInset>
				</SidebarProvider>
			</Authenticated>

			<Unauthenticated>
				<div className="flex w-full items-center justify-center p-8">
					<div className="mx-auto w-full max-w-md">
						<div className="mb-8 text-center">
							<h1 className="mb-4 font-bold text-4xl text-gray-900">
								Brand Identity Manager
							</h1>
							<p className="text-gray-600 text-xl">
								Create and manage your company's complete brand identity
							</p>
						</div>
						<SignInFormEmailLink />
					</div>
				</div>
			</Unauthenticated>
		</div>
	);
}
