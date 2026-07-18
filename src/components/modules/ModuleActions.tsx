import { useCustomer } from "autumn-js/react";
import { Copy, Download, MoreVertical, RefreshCw } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type UseBrandModuleResult from "../../hooks/useBrandModule";
import { Billing } from "../billing";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { VersionSelector } from "./VersionSelector";

export type ModuleAction = {
	icon: ReactNode;
	label: string;
	onClick: () => void;
	disabled?: boolean;
	variant?: "default" | "destructive";
};

export type ActionHandlers = {
	onCopy?: () => void;
	onDownload?: () => void;
	onRegenerate?: () => Promise<void>;
};

type ModuleActionsProps = {
	ctx: UseBrandModuleResult;
	variant?: "full" | "compact";
	actions?: ModuleAction[];
	onCopy?: () => void;
	onDownload?: () => void;
	onRegenerate?: () => Promise<void>;
	hideVersionSelector?: boolean;
	hideRegenerate?: boolean;
};

type BuildActionsOptions = {
	ctx: UseBrandModuleResult;
	handlers: ActionHandlers;
	customActions?: ModuleAction[];
	iconSize?: "sm" | "md";
	hideRegenerate?: boolean;
};

/**
 * Builds the standard set of actions for module components.
 * Conditionally includes regenerate, copy/download if handlers provided.
 */
function buildModuleActions({
	ctx,
	handlers,
	customActions = [],
	iconSize = "md",
	hideRegenerate = false,
}: BuildActionsOptions): ModuleAction[] {
	const iconClass = iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
	const actions: ModuleAction[] = [];

	// Copy action (if handler provided)
	if (handlers.onCopy) {
		actions.push({
			icon: <Copy className={iconClass} />,
			label: "Copy",
			onClick: handlers.onCopy,
		});
	}
	const { check } = useCustomer();

	// Regenerate action (if not hidden)
	if (!hideRegenerate) {
		const regenerateHandler = () => {
			const { data } = check({
				featureId: "credits",
				requiredBalance: 1,
				dialog: Billing,
			});

			if (!data?.allowed) {
				toast.error(
					"You're out of usage. Please upgrade your plan to continue."
				);
				return;
			}
			if (handlers.onRegenerate) {
				handlers.onRegenerate();
			} else {
				ctx.regenerate(false);
			}
		};
		actions.push({
			icon: (
				<RefreshCw
					className={`${iconClass} ${ctx.isRegenerating ? "animate-spin" : ""}`}
				/>
			),
			label: ctx.isRegenerating ? "Generating..." : "Regenerate",
			onClick: () => regenerateHandler(),
			disabled: ctx.isRegenerating,
		});
	}

	// Download action (if handler provided)
	if (handlers.onDownload) {
		actions.push({
			icon: <Download className={iconClass} />,
			label: "Download",
			onClick: handlers.onDownload,
		});
	}

	// Custom actions
	actions.push(...customActions);

	return actions;
}

function PublishButton({ ctx }: { ctx: UseBrandModuleResult }) {
	if (!ctx.selected || ctx.selected.published) {
		return null;
	}

	return (
		<button
			className="rounded bg-orange-100 px-3 font-medium text-orange-800 text-xs transition-colors hover:bg-orange-200 disabled:opacity-50"
			disabled={ctx.isPublishing}
			onClick={() => ctx.publishSelected()}
			type="button"
		>
			{ctx.isPublishing ? "Publishing..." : "Publish"}
		</button>
	);
}

/**
 * Module actions component that can render in either compact (dropdown) or full (inline bar) mode.
 *
 * - **compact**: Three-dot menu with dropdown actions (default)
 * - **full**: Full-width bar with version selector and inline action buttons
 */
export function ModuleActions({
	ctx,
	variant = "full",
	actions = [],
	onCopy,
	onDownload,
	onRegenerate,
	hideVersionSelector = false,
	hideRegenerate = false,
}: ModuleActionsProps) {
	const posthog = usePostHog();
	const iconSize = variant === "full" ? "sm" : "md";
	const allActions = buildModuleActions({
		ctx,
		handlers: { onCopy, onDownload, onRegenerate },
		customActions: actions,
		iconSize,
		hideRegenerate,
	}).map((action) =>
		action.label === "Copy"
			? {
					...action,
					onClick: () => {
						posthog.capture("brand_asset_copied");
						action.onClick();
					},
				}
			: action
	);

	// Compact variant: dropdown menu
	if (variant === "compact") {
		const showPublish = ctx.selected && !ctx.selected.published;

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button size="icon-sm" variant="ghost">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					{allActions.map((action) => (
						<DropdownMenuItem
							disabled={action.disabled}
							key={action.label}
							onClick={action.onClick}
							variant={action.variant}
						>
							{action.icon}
							<span>{action.label}</span>
						</DropdownMenuItem>
					))}

					{showPublish && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="bg-orange-50 font-medium text-orange-800 focus:bg-orange-100 focus:text-orange-900"
								disabled={ctx.isPublishing}
								onClick={() => ctx.publishSelected()}
							>
								<span>{ctx.isPublishing ? "Publishing..." : "Publish"}</span>
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	// Full variant: inline action bar
	return (
		<div className="flex items-center gap-2">
			{/* Version selector with publish button */}
			{!hideVersionSelector && (
				<div className="flex items-center gap-2">
					<VersionSelector ctx={ctx} />
					<PublishButton ctx={ctx} />
				</div>
			)}

			{/* Action buttons */}
			{allActions.map((action) => (
				<Button
					className="opacity-0 transition-opacity duration-200 group-hover:opacity-50"
					disabled={action.disabled}
					key={action.label}
					onClick={action.onClick}
					size="xs"
					title={action.label}
					type="button"
					variant="ghost"
				>
					{action.icon}
					<span className="text-xs">{action.label}</span>
				</Button>
			))}
		</div>
	);
}
