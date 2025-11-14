import {
	IconBuilding,
	IconDots,
	IconFolder,
	IconPlus,
	IconShare3,
	IconTrash,
	IconWriting,
} from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from "convex/react";
import { PanelLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Billing } from "@/components/billing";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { NavUser } from "@/components/nav-user";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AnimatedShinyText } from "./ui/animated-shiny-text";

function getCompanyInitials(name: string): string {
	const words = name.split(" ").filter((w) => w.length > 0);
	if (words.length >= 2) {
		return (words[0][0] + words[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	const companies = useQuery(api.companies.listWithBrandData) || [];
	const deleteCompany = useMutation(api.companies.deleteCompany);
	const navigate = useNavigate();
	const { toggleSidebar, state, isMobile } = useSidebar();
	const { check } = useCustomer();
	const [isHovered, setIsHovered] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);
	const [companyToDelete, setCompanyToDelete] = useState<{
		id: Id<"companies">;
		name: string;
	} | null>(null);
	const isCollapsed = state === "collapsed";

	const handleNewCompanyClick = () => {
		// If user already has companies, check if they have the multiple_companies feature
		if (companies.length > 0) {
			const { data } = check({
				featureId: "multiple_companies",
				dialog: Billing,
			});

			if (!data?.allowed) {
				toast.error("Please upgrade your plan to create multiple companies.");
				return;
			}
		}

		navigate({ to: "/c/new" });
	};

	const handleDeleteClick = (
		companyId: Id<"companies">,
		companyName: string
	) => {
		setCompanyToDelete({ id: companyId, name: companyName });
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!companyToDelete) {
			return;
		}

		try {
			await deleteCompany({ companyId: companyToDelete.id });
			toast.success("Company deleted successfully");
			setDeleteDialogOpen(false);
			setCompanyToDelete(null);
			navigate({ to: "/" });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete company"
			);
		}
	};

	return (
		<Sidebar className="border-r" collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="flex w-full items-center gap-2 py-1.5">
							<SidebarMenuButton
								asChild={!isCollapsed}
								className={cn(
									"data-[slot=sidebar-menu-button]:p-1.5!",
									isCollapsed && "group-data-[collapsible=icon]:justify-center"
								)}
								onClick={isCollapsed ? toggleSidebar : undefined}
								onMouseEnter={() => setIsHovered(true)}
								onMouseLeave={() => setIsHovered(false)}
								size="lg"
								tooltip={isCollapsed ? "BrandKite" : undefined}
							>
								{isCollapsed ? (
									<div className="flex items-center justify-center">
										{isHovered ? (
											<PanelLeftIcon className="size-5 text-gray-400" />
										) : (
											<IconBuilding className="size-5" />
										)}
									</div>
								) : (
									<Link className="flex items-center gap-2" to="/">
										<IconBuilding className="size-5! shrink-0" />
										<span className="font-semibold text-base">BrandKite</span>
									</Link>
								)}
							</SidebarMenuButton>
							{!isCollapsed && <SidebarTrigger className="ml-auto" />}
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<Authenticated>
					<SidebarGroup>
						<SidebarGroupLabel>Companies</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										className={cn(
											"group my-2 rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
											"group-data-[collapsible=icon]:gap-0",
											"group-data-[collapsible=icon]:justify-center"
										)}
										onClick={handleNewCompanyClick}
										tooltip={isCollapsed ? "New Company" : undefined}
									>
										{isCollapsed ? (
											<div className="flex items-center justify-center">
												<IconPlus className="size-5 text-neutral-800" />
											</div>
										) : (
											<AnimatedShinyText className="inline-flex items-center justify-center gap-2 px-4 py-1 transition ease-out hover:text-neutral-800 hover:duration-300 hover:dark:text-neutral-400">
												<span>New Company</span>
												<IconWriting className="size-5" />
											</AnimatedShinyText>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
								{companies.map((company) => {
									// Use company.name as the source of truth
									const displayName = company.name || "Untitled";
									const logoUrl = company.logoUrl;

									return (
										<SidebarMenuItem key={company._id}>
											<SidebarMenuButton
												asChild
												className={cn(
													"group-data-[collapsible=icon]:gap-0",
													"group-data-[collapsible=icon]:justify-center"
												)}
											>
												<Link params={{ id: company._id }} to="/c/$id">
													{logoUrl ? (
														<Avatar className="size-5! rounded-sm">
															<AvatarImage alt={displayName} src={logoUrl} />
															<AvatarFallback className="rounded-sm text-xs">
																{getCompanyInitials(displayName)}
															</AvatarFallback>
														</Avatar>
													) : (
														<Avatar className="size-5! rounded-sm">
															<AvatarFallback className="rounded-sm text-xs">
																{getCompanyInitials(displayName)}
															</AvatarFallback>
														</Avatar>
													)}
													<span className="truncate">{displayName}</span>
												</Link>
											</SidebarMenuButton>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<SidebarMenuAction
														className="rounded-sm data-[state=open]:bg-accent"
														showOnHover
													>
														<IconDots />
														<span className="sr-only">More</span>
													</SidebarMenuAction>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align={isMobile ? "end" : "start"}
													className="w-48 rounded-lg"
													side={isMobile ? "bottom" : "right"}
												>
													<DropdownMenuItem asChild>
														<Link params={{ id: company._id }} to="/c/$id">
															<IconFolder />
															<span>Open</span>
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															toast.info("Share functionality coming soon!");
														}}
													>
														<IconShare3 />
														<span>Share</span>
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleDeleteClick(company._id, displayName)
														}
														variant="destructive"
													>
														<IconTrash />
														<span>Delete Company</span>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</Authenticated>
				<Unauthenticated>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										className={cn(
											"group my-2 rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
											"group-data-[collapsible=icon]:gap-0",
											"group-data-[collapsible=icon]:justify-center"
										)}
										onClick={() => setLoginDialogOpen(true)}
										tooltip={isCollapsed ? "New Company" : undefined}
									>
										{isCollapsed ? (
											<div className="flex items-center justify-center">
												<IconPlus className="size-5 text-neutral-800" />
											</div>
										) : (
											<AnimatedShinyText className="inline-flex items-center justify-between gap-2 px-4 py-1 transition ease-out hover:text-neutral-800 hover:duration-300 hover:dark:text-neutral-400">
												<span>Create Brand</span>
												<IconWriting className="size-5" />
											</AnimatedShinyText>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					{!isCollapsed && (
						<SidebarGroup className="mt-auto border-t pt-4">
							<SidebarGroupContent>
								<div className="space-y-3 px-2 text-sm">
									<div>
										<h3 className="mb-2 font-semibold text-sm">
											About BrandKite
										</h3>
										<p className="text-muted-foreground text-xs leading-relaxed">
											Create and manage your company's complete brand identity.
											Generate professional logos, colors, typography, and brand
											guidelines powered by AI.
										</p>
									</div>
									<div>
										<h4 className="mb-1.5 font-medium text-xs">Key Features</h4>
										<ul className="space-y-1 text-muted-foreground text-xs">
											<li className="flex items-start gap-1.5">
												<span className="mt-0.5">•</span>
												<span>AI-powered brand generation</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="mt-0.5">•</span>
												<span>Complete brand identity system</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="mt-0.5">•</span>
												<span>Logo, colors, and typography</span>
											</li>
											<li className="flex items-start gap-1.5">
												<span className="mt-0.5">•</span>
												<span>Brand guidelines and documentation</span>
											</li>
										</ul>
									</div>
									<div className="pt-2">
										<p className="mb-3 text-muted-foreground text-xs">
											<button
												className="cursor-pointer font-medium text-primary hover:text-primary-hover hover:underline"
												onClick={() => setLoginDialogOpen(true)}
												type="button"
											>
												Sign in{" "}
											</button>{" "}
											to create your own brand identity.
											{/* <Link
												className="cursor-pointer font-medium text-primary hover:text-primary-hover hover:underline"
												to="/gallery"
											>
												explore public examples
											</Link> */}
										</p>
										<Button
											className="w-full"
											onClick={() => setLoginDialogOpen(true)}
											size="sm"
										>
											Sign In
										</Button>
									</div>
								</div>
							</SidebarGroupContent>
						</SidebarGroup>
					)}
				</Unauthenticated>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{companyToDelete?.name}" and all its
							brand modules. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDeleteConfirm}
						>
							Delete Company
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<LoginPromptDialog
				description="Please sign in to create a new company."
				onOpenChange={setLoginDialogOpen}
				open={loginDialogOpen}
				title="Sign in to create a company"
			/>
		</Sidebar>
	);
}
