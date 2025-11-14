import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type UseBrandModuleResult from "../../hooks/useBrandModule";
import { cn } from "../../lib/utils";
import { LoadingSkeleton } from "./LoadingSkeleton";
import {
	type ActionHandlers,
	type ModuleAction,
	ModuleActions,
} from "./ModuleActions";
import { VersionSelector } from "./VersionSelector";

const actionsVariants = cva("", {
	variants: {
		position: {
			compact:
				"absolute top-2 right-2 z-10 rounded-md bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/80",
			full: "flex items-center gap-2 py-2",
		},
	},
	defaultVariants: {
		position: "full",
	},
});

type BlockWrapperProps = {
	children: ReactNode;
	actions?: ModuleAction[];
	actionHandlers?: ActionHandlers;
	actionsComponent?: ReactNode;
	className?: string;
	actionsVariant?: VariantProps<typeof actionsVariants>["position"];
	// Optional loading state support
	ctx: UseBrandModuleResult;
	showLoadingState?: boolean;
	hideActions?: boolean;
	hideVersionSelector?: boolean;
	hideRegenerate?: boolean;
	loadingSkeleton?: ReactNode;
};

export function BlockWrapper({
	children,
	loadingSkeleton = <LoadingSkeleton />,
	actions,
	actionHandlers,
	actionsComponent,
	className,
	actionsVariant = "full",
	ctx,
	showLoadingState = true,
	hideActions = false,
	hideVersionSelector = false,
	hideRegenerate = false,
}: BlockWrapperProps) {
	const isLoading =
		(showLoadingState &&
			ctx?.selected &&
			(ctx.selected.generationStatus === "queued" ||
				ctx.selected.generationStatus === "in_progress")) ||
		!ctx.selected?.data;
	// Always use compact actions variant on mobile (sm and down).
	const isMobile =
		typeof window !== "undefined"
			? window.matchMedia("(max-width: 640px)").matches
			: false;
	const effectiveActionsVariant = isMobile ? "compact" : actionsVariant;

	return (
		<div className={cn("group relative", className)}>
			{isLoading ? loadingSkeleton : children}
			{!hideActions && (
				<div
					className={cn(
						isMobile
							? "opacity-50"
							: "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
						actionsVariants({ position: effectiveActionsVariant })
					)}
				>
					{actionsComponent ?? (
						<ModuleActions
							actions={actions}
							ctx={ctx}
							hideRegenerate={hideRegenerate}
							hideVersionSelector={hideVersionSelector}
							variant={effectiveActionsVariant ?? undefined}
							{...actionHandlers}
						/>
					)}
				</div>
			)}
			{effectiveActionsVariant === "compact" && !hideVersionSelector && (
				<div
					className={cn(
						"absolute right-2 bottom-2 transition-opacity duration-200 group-hover:opacity-100",
						isMobile ? "opacity-50" : "opacity-0"
					)}
				>
					<VersionSelector ctx={ctx} />
				</div>
			)}
		</div>
	);
}
