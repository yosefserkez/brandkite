import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { AnimatedKit } from "@/components/landing/animated-kit";
import { LandingHero } from "@/components/landing/landing-hero";
import { TryItInput } from "@/components/landing/try-it-input";
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
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);

	const openLogin = () => setLoginDialogOpen(true);

	return (
		<div className="h-full overflow-y-auto bg-white">
			<LandingHero onGenerate={openLogin} />

			{/* Live "watch it build" demo — a real generated kit */}
			<section className="pb-8 md:pb-12">
				{publicCompany === undefined ? (
					<div className="flex h-64 items-center justify-center">
						<div className="h-full w-full max-w-2xl">
							<FlickeringGrid />
						</div>
					</div>
				) : null}
				{publicCompany ? (
					<AnimatedKit
						companyId={publicCompany._id as Id<"companies">}
						fallbackName={publicCompany.name}
						logoUrl={publicCompany.logoUrl}
					/>
				) : null}
			</section>

			{/* The full, real kit */}
			{publicCompany ? (
				<section className="w-full border-gray-100 border-t py-10 md:py-14">
					<div className="mx-auto max-w-5xl px-4">
						<h2 className="mb-6 text-center font-semibold text-2xl text-gray-950 tracking-tight md:text-3xl">
							Explore the full kit
						</h2>
						<BrandStudioPage companyId={publicCompany._id as Id<"companies">} />
					</div>
				</section>
			) : null}

			{/* Bottom conversion CTA */}
			<section className="border-gray-100 border-t bg-white py-14 md:py-20">
				<div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 text-center">
					<h2 className="text-balance font-semibold text-4xl text-gray-950 leading-tight tracking-tight md:text-5xl">
						Your brand is one prompt away.
					</h2>
					<div className="flex w-full max-w-xl flex-col items-center gap-2.5">
						<TryItInput onSubmit={openLogin} />
						<span className="text-gray-400 text-xs">
							Free to start &middot; no credit card required
						</span>
					</div>
				</div>
			</section>

			<LoginPromptDialog
				description="Sign in to start building your brand identity with AI-powered tools."
				onOpenChange={setLoginDialogOpen}
				open={loginDialogOpen}
				title="Get started with Brandkite"
			/>
		</div>
	);
}
