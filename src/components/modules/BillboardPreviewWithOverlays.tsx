import { Ripple } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";
import type { NameWithDomains } from "../../../convex/modules/name";
import { HeartPointer } from "../ui/heart-pointer";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { VideoText } from "../ui/video-text";
import { BillboardPreview } from "./BillboardPreview";

type BillboardPreviewWithOverlaysProps = {
	name: string;
	containerHeight?: string;
	className?: string;
	nameData?: NameWithDomains;
	showReasoningDetails?: boolean;
	bottomRightContent?: React.ReactNode;
	isLoading?: boolean;
};

export function BillboardPreviewWithOverlays({
	name,
	containerHeight = "400px",
	className,
	nameData,
	showReasoningDetails = true,
	bottomRightContent,
	isLoading = false,
}: BillboardPreviewWithOverlaysProps) {
	if (isLoading) {
		return (
			<BillboardPreviewWithOverlaysSkeleton
				className={className}
				containerHeight={containerHeight}
				showBottomRightContent={!!bottomRightContent}
				showReasoningDetails={showReasoningDetails}
			/>
		);
	}

	return (
		<div className="fade-in relative animate-in duration-500">
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
						<TooltipContent align="start" className="" hideArrow side="top">
							<div className="space-y-1">
								{nameData.domains.map((domain) => (
									<div
										className="flex items-center gap-1.5 font-mono text-xs"
										key={domain}
									>
										<div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
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

type BillboardPreviewWithOverlaysSkeletonProps = {
	containerHeight?: string;
	className?: string;
	showReasoningDetails?: boolean;
	showBottomRightContent?: boolean;
};

export function BillboardPreviewWithOverlaysSkeleton({
	containerHeight = "400px",
	className,
	showReasoningDetails = true,
	showBottomRightContent = false,
}: BillboardPreviewWithOverlaysSkeletonProps) {
	return (
		<div className="relative">
			<HeartPointer />
			{/* Billboard skeleton */}
			<div
				className={cn(
					"mx-auto flex items-center justify-center bg-black/20",
					className
				)}
				style={{ height: containerHeight, width: "100%" }}
			>
				<VideoText
					className=""
					src="https://cdn.magicui.design/ocean-small.webm"
				>
					loading...
				</VideoText>

				{/* <AnimatedShinyText className="inline-flex items-center justify-center transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
					<span>Crafting your brand...</span>
				</AnimatedShinyText> */}
			</div>
			<Ripple style={{ height: containerHeight, width: "100%" }} />

			{/* Name skeleton - top left */}
			<div className="absolute top-4 left-4 z-10">
				<Skeleton className="h-5 w-32" />
			</div>

			{/* Reasoning skeleton - top right */}
			{showReasoningDetails && (
				<div className="absolute top-4 right-4 z-10 max-w-md">
					<Skeleton className="h-5 w-64" />
				</div>
			)}

			{/* Domains skeleton - bottom left */}
			<div className="absolute bottom-4 left-4 z-10">
				<div className="flex items-center gap-1.5">
					<Skeleton className="h-2 w-2 rounded-full" />
					<Skeleton className="h-5 w-40" />
				</div>
			</div>

			{/* Bottom right content skeleton */}
			{showBottomRightContent && (
				<div className="absolute right-4 bottom-4 z-10">
					<Skeleton className="h-10 w-10 rounded-full" />
				</div>
			)}
		</div>
	);
}
