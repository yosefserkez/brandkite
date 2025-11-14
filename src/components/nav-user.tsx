import { useAuthActions } from "@convex-dev/auth/react";
import {
	IconCreditCard,
	IconDotsVertical,
	IconLogout,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { api } from "../../convex/_generated/api";
import { Billing } from "./billing";

export function NavUser() {
	const { isMobile } = useSidebar();
	const { signOut } = useAuthActions();
	const viewer = useQuery(api.users.viewer);
	const [billingOpen, setBillingOpen] = useState(false);

	// If no user is logged in, return null
	if (!viewer) {
		return null;
	}

	const userName = viewer.name || "User";
	const userEmail = viewer.email || "";
	const userInitials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
						>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								<AvatarImage src="https://api.dicebear.com/9.x/glass/svg?seed=Leo" />
								<AvatarFallback className="rounded-lg">
									{userInitials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								{/* <span className="truncate font-medium">{userName}</span> */}
								<span className="truncate text-muted-foreground text-xs">
									{userEmail}
								</span>
							</div>
							<IconDotsVertical className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src="https://api.dicebear.com/9.x/glass/svg?seed=Leo" />
									<AvatarFallback className="rounded-lg">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									{/* <span className="truncate font-medium">{userName}</span> */}
									<span className="truncate text-muted-foreground text-xs">
										{userEmail}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{/* <DropdownMenuItem>
								<IconUserCircle />
								Account
							</DropdownMenuItem> */}
							<DropdownMenuItem onClick={() => setBillingOpen(true)}>
								<IconCreditCard />
								Billing
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={async () => {
								await signOut();
								window.location.href = "/";
							}}
						>
							<IconLogout />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<Billing open={billingOpen} setOpen={setBillingOpen} />
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
