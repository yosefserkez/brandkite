import { Link } from "@tanstack/react-router";
import { BrandKiteLogo } from "@/components/brandkiteLogo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileHeader() {
	return (
		<header className="relative flex items-center justify-between gap-2 border-b bg-background p-4 md:hidden">
			<SidebarTrigger className="-ml-1" />
			<Link
				className="-translate-x-1/2 absolute left-1/2 flex items-center gap-2"
				to="/"
			>
				<BrandKiteLogo className="size-7! shrink-0" />
				<span className="pr-1 text-3xl" style={{ fontFamily: "Caveat" }}>
					Brandkite
				</span>
			</Link>
			<div className="size-7" />
		</header>
	);
}
