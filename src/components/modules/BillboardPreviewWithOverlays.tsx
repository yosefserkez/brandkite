import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { NameWithDomains } from "../../../convex/modules/name";
import { SkeletonFlickeringGrid } from "../skeleton-flickering-grid";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BillboardPreview } from "./BillboardPreview";

type BillboardPreviewWithOverlaysProps = {
	company: { name: string; logoUrl?: string };
	containerHeight?: string;
	className?: string;
	nameData?: NameWithDomains;
	showReasoningDetails?: boolean;
	bottomRightContent?: React.ReactNode;
	isLoading?: boolean;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export function BillboardPreviewWithOverlays({
	company: { name, logoUrl },
	containerHeight = "400px",
	className,
	nameData,
	showReasoningDetails = true,
	bottomRightContent,
	isLoading = false,
}: BillboardPreviewWithOverlaysProps) {
	const isMobile = useIsMobile();
	const [isReasoningTooltipOpen, setIsReasoningTooltipOpen] = useState(false);
	const [isDomainsTooltipOpen, setIsDomainsTooltipOpen] = useState(false);

	useEffect(() => {
		if (!isMobile) {
			setIsReasoningTooltipOpen(false);
			setIsDomainsTooltipOpen(false);
		}
	}, [isMobile]);

	if (isLoading) {
		return <BillboardSkeleton />;
	}

	return (
		<div className="fade-in relative animate-in duration-500">
			<BillboardPreview
				className={className}
				containerHeight={containerHeight}
				logo={logoUrl}
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
				<div className="absolute top-4 right-4 z-10 max-w-md text-right">
					<Tooltip
						onOpenChange={isMobile ? setIsReasoningTooltipOpen : undefined}
						open={isMobile ? isReasoningTooltipOpen : undefined}
					>
						<TooltipTrigger asChild>
							<button
								aria-label={isMobile ? "Show name reasoning" : undefined}
								className={cn(
									"pointer-events-auto inline-flex items-center justify-center rounded-full text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
									isMobile
										? "h-8 w-8 cursor-pointer bg-white/20 backdrop-blur"
										: "cursor-help bg-transparent p-0 text-right hover:text-white/80"
								)}
								onClick={
									isMobile
										? () => setIsReasoningTooltipOpen((prev) => !prev)
										: undefined
								}
								type="button"
							>
								{isMobile ? (
									<Info aria-hidden className="h-4 w-4" />
								) : (
									<span className="text-sm text-white leading-tight">
										{nameData.name.reasoning.summary}
									</span>
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent
							align="end"
							className="max-w-sm"
							hideArrow
							side="bottom"
						>
							<p className="text-sm">{nameData.name.reasoning.details}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			)}

			{/* Domains - bottom left */}
			{nameData && nameData.domains.length > 0 && (
				<div className="absolute bottom-4 left-4 z-10">
					<Tooltip
						onOpenChange={isMobile ? setIsDomainsTooltipOpen : undefined}
						open={isMobile ? isDomainsTooltipOpen : undefined}
					>
						<TooltipTrigger asChild>
							<button
								aria-label={
									isMobile
										? `Show domains for ${nameData.name.name}`
										: undefined
								}
								className={cn(
									"pointer-events-auto flex items-center gap-1.5 rounded-full bg-transparent p-0 text-left text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
									isMobile ? "cursor-pointer" : "cursor-help"
								)}
								onClick={
									isMobile
										? () => setIsDomainsTooltipOpen((prev) => !prev)
										: undefined
								}
								type="button"
							>
								<div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
								<span className="font-mono text-sm text-white">
									{nameData.domains[0]}
								</span>
								{nameData.domains.length > 1 && (
									<span className="text-sm text-white/80">
										and {nameData.domains.length - 1} more
									</span>
								)}
							</button>
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

export function BillboardSkeleton() {
	return (
		<Card className="h-[400px] w-full rounded-t-lg border">
			<CardHeader>
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					Company Name
				</p>
			</CardHeader>
			<CardContent>
				<SkeletonFlickeringGrid height={320} />
			</CardContent>
		</Card>
	);
}
