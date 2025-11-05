import type { NameWithDomains } from "../../../convex/modules/name";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BillboardPreview } from "./BillboardPreview";

type BillboardPreviewWithOverlaysProps = {
	name: string;
	containerHeight?: string;
	className?: string;
	nameData?: NameWithDomains;
	showReasoningDetails?: boolean;
	bottomRightContent?: React.ReactNode;
};

export function BillboardPreviewWithOverlays({
	name,
	containerHeight = "400px",
	className,
	nameData,
	showReasoningDetails = true,
	bottomRightContent,
}: BillboardPreviewWithOverlaysProps) {
	return (
		<div className="relative">
			<BillboardPreview
				className={className}
				containerHeight={containerHeight}
				name={name}
			/>

			{/* Top gradient overlay */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/60 to-transparent" />

			{/* Bottom gradient overlay */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/60 to-transparent" />

			{/* Name - top left */}
			<div className="absolute top-4 left-4 z-10">
				<span className="font-medium text-sm text-white">{name}</span>
			</div>

			{/* Reasoning - top right */}
			{nameData && showReasoningDetails && (
				<div className="absolute top-4 right-4 z-10 max-w-md">
					<Tooltip>
						<TooltipTrigger asChild>
							<p className="pointer-events-auto cursor-help text-right text-sm text-white">
								{nameData.name.reasoning.summary}
							</p>
						</TooltipTrigger>
						<TooltipContent className="max-w-sm" side="left">
							<p className="text-sm">{nameData.name.reasoning.details}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			)}

			{/* Domains - bottom left */}
			{nameData && nameData.domains.length > 0 && (
				<div className="absolute bottom-4 left-4 z-10">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="pointer-events-auto flex cursor-pointer items-center gap-1.5">
								<div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
								<span className="font-mono text-sm text-white">
									{nameData.domains[0]}
								</span>
								{nameData.domains.length > 1 && (
									<span className="text-sm text-white/80">
										and {nameData.domains.length - 1} more
									</span>
								)}
							</div>
						</TooltipTrigger>
						<TooltipContent className="max-w-xs" side="top">
							<div className="space-y-1">
								{nameData.domains.map((domain) => (
									<div className="font-mono text-xs" key={domain}>
										{domain}
									</div>
								))}
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			)}

			{/* Bottom right content slot */}
			{bottomRightContent && (
				<div className="absolute right-4 bottom-4 z-10">
					{bottomRightContent}
				</div>
			)}
		</div>
	);
}
