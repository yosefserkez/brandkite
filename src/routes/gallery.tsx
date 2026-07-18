import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/gallery")({
	component: GalleryRoute,
	head: () => ({
		meta: [
			{ title: "Brand kit gallery — Brandkite" },
			{
				name: "description",
				content:
					"Browse complete AI-generated brand kits — names, logos, colors, typography, and brand strategy — made with Brandkite.",
			},
		],
	}),
});

function getCompanyInitials(name: string): string {
	const words = name.split(" ").filter((w) => w.length > 0);
	if (words.length >= 2) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

function GalleryRoute() {
	const publicCompanies = useQuery(api.companies.listPublicWithBrandData) || [];

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
						<main className="flex-1 overflow-y-auto">
							<div className="mx-auto max-w-7xl px-4 py-8">
								<div className="mb-8">
									<h1 className="mb-2 font-semibold text-3xl text-gray-900">
										Public Gallery
									</h1>
									<p className="text-gray-600">
										Explore publicly shared brand identities
									</p>
								</div>

								{publicCompanies.length === 0 ? (
									<div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
										<div className="text-center">
											<p className="text-gray-600">
												No public companies available yet.
											</p>
										</div>
									</div>
								) : (
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
										{publicCompanies.map((company) => {
											const displayName =
												company.nameModule?.name?.name ||
												company.name ||
												"Untitled";
											const logoUrl = company.logoUrl;

											return (
												<Link
													className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-md"
													key={company._id}
													params={{ id: company._id }}
													to="/public/c/$id"
												>
													<div className="flex flex-col items-center gap-4">
														{logoUrl ? (
															<Avatar className="size-20 rounded-lg">
																<AvatarImage alt={displayName} src={logoUrl} />
																<AvatarFallback className="rounded-lg text-2xl">
																	{getCompanyInitials(displayName)}
																</AvatarFallback>
															</Avatar>
														) : (
															<Avatar className="size-20 rounded-lg">
																<AvatarFallback className="rounded-lg text-2xl">
																	{getCompanyInitials(displayName)}
																</AvatarFallback>
															</Avatar>
														)}
														<div className="w-full text-center">
															<h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary">
																{displayName}
															</h3>
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								)}
							</div>
						</main>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
