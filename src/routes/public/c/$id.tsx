import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/public/c/$id")({
	component: PublicCompanyRoute,
});

function PublicCompanyRoute() {
	const { id } = Route.useParams();
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
						<header className="flex items-center gap-2 border-b bg-background p-4 md:hidden">
							<SidebarTrigger className="-ml-1" />
						</header>
						<main className="flex-1 overflow-hidden">
							<BrandStudioPage companyId={id as Id<"companies">} />
						</main>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
