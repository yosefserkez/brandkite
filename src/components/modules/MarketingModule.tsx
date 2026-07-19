import { Authenticated } from "convex/react";
import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandMarketing } from "../../../convex/modules/marketing";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandSelector } from "../../hooks/useCompanyBrand";
import { cn } from "../../lib/utils";
import { SuspenseCard } from "../suspense-card";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { AD_PLACEMENTS, AdMockup, type AdPlacement } from "./AdMockups";
import { BlockWrapper } from "./BlockWrapper";

type MarketingGoal = "awareness" | "signups" | "sales";

const GOAL_OPTIONS: { value: MarketingGoal; label: string }[] = [
	{ value: "awareness", label: "Awareness" },
	{ value: "signups", label: "Sign-ups" },
	{ value: "sales", label: "Sales" },
];

/** Copy guidance passed to generation, derived from the previewed placement. */
const GENERATION_PLATFORM: Record<AdPlacement, string> = {
	instagram: "meta",
	facebook: "meta",
	tiktok: "meta",
	x: "generic",
	linkedin: "linkedin",
	google: "google",
};

const PLACEMENT_GRID: Record<AdPlacement, string> = {
	instagram: "grid gap-4 sm:grid-cols-2 md:grid-cols-3",
	facebook: "grid gap-4 sm:grid-cols-2 md:grid-cols-3",
	linkedin: "grid gap-4 sm:grid-cols-2 md:grid-cols-3",
	x: "grid gap-4 sm:grid-cols-2 md:grid-cols-3",
	tiktok: "mx-auto grid w-full max-w-3xl gap-4 grid-cols-2 md:grid-cols-3",
	google: "mx-auto flex w-full max-w-xl flex-col gap-4",
};

type MarketingModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function MarketingModule({
	companyId,
	className,
}: MarketingModuleProps) {
	const ctx = useBrandModule(companyId, "marketing");
	const [placement, setPlacement] = useState<AdPlacement>("instagram");
	const [goal, setGoal] = useState<MarketingGoal>("signups");

	const data = ctx.selected?.data as BrandMarketing | undefined;

	const onRegenerate = () =>
		ctx.regenerate({
			options: { platform: GENERATION_PLATFORM[placement], goal },
		});

	return (
		<BlockWrapper
			actionHandlers={{ onRegenerate }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Marketing" />}
		>
			<Card>
				<CardHeader className="gap-1">
					<p className="wrap-break-word col-span-full place-self-stretch font-medium text-[11px] text-gray-400 uppercase tracking-[0.08em]">
						Marketing
					</p>
					<BrandText
						as="p"
						className="wrap-break-word text-gray-500 text-sm leading-relaxed"
					>
						{data?.valueProp ?? ""}
					</BrandText>
				</CardHeader>
				<CardContent className="space-y-4 pt-5">
					<fieldset className="flex flex-wrap gap-1">
						<legend className="sr-only">Preview placement</legend>
						{AD_PLACEMENTS.map((option) => (
							<button
								aria-pressed={placement === option.value}
								className={cn(
									"rounded-full px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
									placement === option.value
										? "bg-gray-100 font-medium text-gray-900"
										: "text-gray-500 hover:text-gray-900"
								)}
								key={option.value}
								onClick={() => setPlacement(option.value)}
								type="button"
							>
								{option.label}
							</button>
						))}
					</fieldset>
					{data && (
						<div className={PLACEMENT_GRID[placement]}>
							{data.ads.map((ad, index) => (
								<AdArtifact
									ad={ad}
									index={index}
									key={`${placement}-${ad.headline}-${index}`}
									placement={placement}
									seed={`${index}-${ad.headline}`}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
			<Authenticated>
				<div className="absolute top-2 left-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								className="rounded-md bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/80"
								size="icon-sm"
								title="Generation options"
								variant="ghost"
							>
								<SlidersHorizontal className="h-3.5 w-3.5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" className="w-64 space-y-3">
							<div className="space-y-1.5">
								<span className="font-medium text-xs">Goal</span>
								<Select
									onValueChange={(value) => setGoal(value as MarketingGoal)}
									value={goal}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{GOAL_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<p className="text-gray-500 text-xs leading-relaxed">
								Copy is tuned to the placement selected above when you
								regenerate.
							</p>
						</PopoverContent>
					</Popover>
				</div>
			</Authenticated>
		</BlockWrapper>
	);
}

type MarketingAd = BrandMarketing["ads"][number];

const ENTER_STAGGER_MS = 70;

type AdArtifactProps = {
	ad: MarketingAd;
	placement: AdPlacement;
	seed: string;
	/** Position in the grid; staggers the enter animation on placement switch. */
	index?: number;
};

function AdArtifact({ ad, placement, seed, index = 0 }: AdArtifactProps) {
	const { replace, companyName } = useBrandText();
	const logoUrl = useCompanyBrandSelector((state) => state.logoUrl);
	const brandName = companyName?.trim() || "Your brand";

	const onCopy = () => {
		const text = [
			replace(ad.headline),
			"",
			replace(ad.primaryText),
			"",
			`CTA: ${replace(ad.cta)}`,
		].join("\n");
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<div
			className="flex h-full animate-ad-enter flex-col gap-1.5 motion-reduce:animate-none"
			style={{ animationDelay: `${index * ENTER_STAGGER_MS}ms` }}
		>
			<AdMockup
				ad={{
					brandName,
					headline: replace(ad.headline),
					primaryText: replace(ad.primaryText),
					cta: replace(ad.cta),
				}}
				logoUrl={logoUrl}
				placement={placement}
				seed={seed}
			/>
			<div className="flex items-center justify-between gap-2 px-1">
				<span className="truncate text-[11px] text-gray-400">
					{replace(ad.angle)}
				</span>
				<button
					aria-label="Copy ad copy"
					className="flex shrink-0 items-center gap-1 rounded-md p-1.5 text-[11px] text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
					onClick={onCopy}
					type="button"
				>
					<Copy className="size-3" />
					Copy
				</button>
			</div>
		</div>
	);
}
