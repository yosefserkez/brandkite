import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingHero } from "@/components/landing/landing-hero";
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

	return (
		<div className="h-full overflow-y-auto bg-white">
			<LandingHero />
			<HowItWorks />
			{publicCompany === undefined ? (
				<div className="flex h-40 items-center justify-center">
					<div className="h-full w-full">
						<FlickeringGrid />
					</div>
				</div>
			) : null}
			{publicCompany ? (
				<div className="mx-auto max-w-5xl px-4 pb-4">
					<div className="mb-2 flex items-center gap-2">
						<div className="h-px flex-1 bg-gray-200" />
						<p className="whitespace-nowrap font-medium text-gray-500 text-xs uppercase tracking-wide">
							See a real kit made in minutes
						</p>
						<div className="h-px flex-1 bg-gray-200" />
					</div>
					<BrandStudioPage companyId={publicCompany._id as Id<"companies">} />
				</div>
			) : null}
		</div>
	);
}
