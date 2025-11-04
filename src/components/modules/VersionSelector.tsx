import { cn } from "@/lib/utils";
import type UseBrandModuleResult from "../../hooks/useBrandModule";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from "../ui/menubar";

type VersionSelectorProps = {
	ctx: UseBrandModuleResult;
	variant?: "default" | "compact";
	className?: string;
};

export function VersionSelector({
	ctx,
	variant = "default",
	className,
}: VersionSelectorProps) {
	const isCompact = variant === "compact";
	const hasVersions = ctx.versions.length > 0;

	if (!hasVersions) {
		return (
			<div
				className={cn(
					className,
					isCompact
						? "flex h-7 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-gray-500 text-xs"
						: "flex h-auto items-center gap-1.5 text-gray-500 text-sm"
				)}
			>
				<span>No versions</span>
			</div>
		);
	}

	return (
		<Menubar
			className={cn(
				className,
				isCompact
					? "h-7 w-fit gap-0 border-gray-200 bg-white p-0 shadow-sm"
					: "h-auto w-fit border-0 bg-transparent p-0 shadow-none"
			)}
		>
			<MenubarMenu>
				<MenubarTrigger
					className={
						isCompact
							? "h-7 gap-1.5 px-2 text-xs"
							: "h-auto gap-1.5 p-0 text-sm"
					}
				>
					<span>v{ctx.selected?.computedVersion ?? "?"}</span>
					<span
						className={`h-1.5 w-1.5 animate-pulse rounded-full ${
							ctx.selected?.published ? "bg-green-500" : "bg-orange-500"
						}`}
						title={ctx.selected?.published ? "Published" : "Not published"}
					/>
				</MenubarTrigger>
				<MenubarContent align={isCompact ? "end" : "start"} sideOffset={4}>
					{ctx.versions.map((m) => (
						<MenubarItem key={m._id} onClick={() => ctx.setSelectedId(m._id)}>
							<span>v{m.computedVersion ?? "?"}</span>
							<span
								className={`ml-auto h-1.5 w-1.5 animate-pulse rounded-full ${
									m.published ? "bg-green-500" : "bg-orange-500"
								}`}
								title={m.published ? "Published" : "Not published"}
							/>
						</MenubarItem>
					))}
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
