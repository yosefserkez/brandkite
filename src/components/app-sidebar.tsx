import {
	IconBuilding,
	IconDots,
	IconFolder,
	IconPlus,
	IconShare3,
	IconTrash,
} from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, useMutation, useQuery } from "convex/react";
import { PanelLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
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

type LogoData = {
	url?: string;
	svg?: string;
	variations?: Array<{ name: string; url: string }>;
};

type BrandContext = {
	summary: string;
	[key: string]: unknown;
};

const NAME_SUMMARY_WORD_COUNT = 3;

function getCompanyName(
	nameModule: unknown,
	brandContextModule: unknown,
	fallbackName: string
): string {
	// Try to get name from nameModule
	if (nameModule && Array.isArray(nameModule) && nameModule.length > 0) {
		const firstNameOption = nameModule[0];
		if (firstNameOption?.name?.name) {
			return firstNameOption.name.name;
		}
	}

	// Try to get name from brandContext summary (first few words)
	if (brandContextModule && typeof brandContextModule === "object") {
		const context = brandContextModule as BrandContext;
		if (context.summary) {
			const words = context.summary
				.split(" ")
				.slice(0, NAME_SUMMARY_WORD_COUNT);
			if (words.length > 0) {
				return words.join(" ");
			}
		}
	}

	// Fallback to company name or "Untitled"
	return fallbackName || "Untitled";
}

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
	const [isHovered, setIsHovered] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [companyToDelete, setCompanyToDelete] = useState<{
		id: Id<"companies">;
		name: string;
	} | null>(null);
	const isCollapsed = state === "collapsed";

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
						<div className="flex w-full items-center gap-2 px-2 py-1.5">
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
								tooltip={isCollapsed ? "Brand Studio" : undefined}
							>
								{isCollapsed ? (
									<div className="flex items-center justify-center">
										{isHovered ? (
											<PanelLeftIcon className="size-5" />
										) : (
											<IconBuilding className="size-5" />
										)}
									</div>
								) : (
									<Link className="flex items-center gap-2" to="/">
										<IconBuilding className="size-5! shrink-0" />
										<span className="font-semibold text-base">
											Brand Studio
										</span>
									</Link>
								)}
							</SidebarMenuButton>
							{!isCollapsed && <SidebarTrigger className="ml-auto" />}
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Companies</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									className="group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
									tooltip={isCollapsed ? "New Company" : undefined}
								>
									{isCollapsed ? (
										<Link
											className="flex items-center justify-center"
											to="/c/new"
										>
											<IconPlus className="size-5 text-neutral-800" />
										</Link>
									) : (
										<Link to="/c/new">
											<AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-800 hover:duration-300 hover:dark:text-neutral-400">
												<span>New Company</span>
												<IconPlus className="mt-1 ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
											</AnimatedShinyText>
										</Link>
									)}
								</SidebarMenuButton>
							</SidebarMenuItem>
							<Authenticated>
								{companies.map((company) => {
									const displayName = getCompanyName(
										company.nameModule,
										company.brandContextModule,
										company.name
									);
									const logoData = company.logoModule as LogoData | undefined;
									const logoUrl = logoData?.url || logoData?.svg;

									return (
										<SidebarMenuItem key={company._id}>
											<SidebarMenuButton asChild>
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
							</Authenticated>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
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
		</Sidebar>
	);
}
