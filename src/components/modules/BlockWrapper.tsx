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

const actionsVariants = cva(
	"opacity-0 transition-opacity duration-200 group-hover:opacity-100",
	{
		variants: {
			position: {
				compact: "absolute top-2 right-2 z-10",
				full: "flex items-center gap-2 py-2",
			},
		},
		defaultVariants: {
			position: "full",
		},
	}
);

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
};

export function BlockWrapper({
	children,
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
		showLoadingState &&
		ctx?.selected &&
		(ctx.selected.generationStatus === "queued" ||
			ctx.selected.generationStatus === "in_progress");

	return (
		<div className={cn("group relative", className)}>
			{isLoading ? <LoadingSkeleton /> : children}
			{!hideActions && (
				<div className={actionsVariants({ position: actionsVariant })}>
					{actionsComponent ?? (
						<ModuleActions
							actions={actions}
							ctx={ctx}
							hideRegenerate={hideRegenerate}
							hideVersionSelector={hideVersionSelector}
							variant={actionsVariant ?? undefined}
							{...actionHandlers}
						/>
					)}
				</div>
			)}
			{actionsVariant === "compact" && !hideVersionSelector && (
				<div className="absolute right-2 bottom-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
					<VersionSelector ctx={ctx} variant="compact" />
				</div>
			)}
		</div>
	);
}
