import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<div className="min-h-screen">
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
							{/* <span className="font-medium text-muted-foreground text-sm">
								BrandKite
							</span> */}
						</header>
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
