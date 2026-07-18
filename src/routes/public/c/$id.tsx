import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import { MobileHeader } from "@/components/mobile-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/public/c/$id")({
	component: PublicCompanyRoute,
	head: () => ({
		meta: [
			{ title: "Shared brand kit — Brandkite" },
			{
				name: "description",
				content:
					"A complete brand identity kit generated with Brandkite — explore the name, logo, colors, typography, and brand strategy.",
			},
		],
	}),
});

function PublicCompanyRoute() {
	const { id } = Route.useParams();

	useEffect(() => {
		track("public_kit_viewed", { company_id: id });
	}, [id]);

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
							<BrandStudioPage companyId={id as Id<"companies">} />
						</main>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
