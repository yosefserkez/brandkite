import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { MobileHeader } from "@/components/mobile-header";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/")({
	component: IndexRoute,
});

function IndexRoute() {
	return (
		<div className="relative flex min-h-screen bg-gray-50">
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
						<MobileHeader />
						<main className="flex-1 overflow-hidden">
							<Authenticated>
								<AuthLandingRedirect />
							</Authenticated>
							<Unauthenticated>
								<PublicCompanyView />
							</Unauthenticated>
						</main>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}

function AuthLandingRedirect() {
	const companies = useQuery(api.companies.listWithBrandData);
	const navigate = useNavigate();

	useEffect(() => {
		if (companies === undefined) {
			return;
		}
		if (companies.length > 0) {
			const first = companies[0];
			navigate({ to: "/c/$id", params: { id: first._id } });
		} else {
			navigate({ to: "/c/new" });
		}
		// Only run once when companies resolve
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [companies, navigate]);

	// Render a lightweight placeholder while redirecting
	return (
		<div className="flex h-full items-center justify-center">
			<div className="h-full w-full">
				<FlickeringGrid />
			</div>
		</div>
	);
}

function PublicCompanyView() {
	const publicCompany = useQuery(api.companies.getFirstPublic);

	if (publicCompany === undefined) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-full w-full">
					<FlickeringGrid />
				</div>
			</div>
		);
	}

	if (!publicCompany) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-2xl text-gray-900">
						No public companies available
					</h2>
					<p className="text-gray-600">
						Please sign in to view your companies or create a new one.
					</p>
				</div>
			</div>
		);
	}

	return <BrandStudioPage companyId={publicCompany._id as Id<"companies">} />;
}
