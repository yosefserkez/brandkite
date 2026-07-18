import { Authenticated } from "convex/react";
import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandMarketing } from "../../../convex/modules/marketing";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import { SuspenseCard } from "../suspense-card";
import { Badge } from "../ui/badge";
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
import { BlockWrapper } from "./BlockWrapper";

type MarketingPlatform = "generic" | "google" | "meta" | "linkedin";
type MarketingGoal = "awareness" | "signups" | "sales";

const PLATFORM_OPTIONS: { value: MarketingPlatform; label: string }[] = [
	{ value: "generic", label: "Generic" },
	{ value: "google", label: "Google" },
	{ value: "meta", label: "Meta" },
	{ value: "linkedin", label: "LinkedIn" },
];

const GOAL_OPTIONS: { value: MarketingGoal; label: string }[] = [
	{ value: "awareness", label: "Awareness" },
	{ value: "signups", label: "Sign-ups" },
	{ value: "sales", label: "Sales" },
];

type MarketingModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function MarketingModule({
	companyId,
	className,
}: MarketingModuleProps) {
	const ctx = useBrandModule(companyId, "marketing");
	const [platform, setPlatform] = useState<MarketingPlatform>("generic");
	const [goal, setGoal] = useState<MarketingGoal>("signups");

	const data = ctx.selected?.data as BrandMarketing | undefined;

	const onRegenerate = () => ctx.regenerate({ options: { platform, goal } });

	return (
		<BlockWrapper
			actionHandlers={{ onRegenerate }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Marketing" />}
		>
			<Card>
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Marketing
					</p>
					<BrandText
						as="p"
						className="wrap-break-word pt-1 text-gray-950 text-lg tracking-tight"
					>
						{data?.valueProp ?? ""}
					</BrandText>
				</CardHeader>
				<CardContent>
					{data && (
						<div className="grid gap-4 md:grid-cols-3">
							{data.ads.map((ad, index) => (
								<AdCard ad={ad} key={`${ad.headline}-${index}`} />
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
								<span className="font-medium text-xs">Platform</span>
								<Select
									onValueChange={(value) =>
										setPlatform(value as MarketingPlatform)
									}
									value={platform}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PLATFORM_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
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
						</PopoverContent>
					</Popover>
				</div>
			</Authenticated>
		</BlockWrapper>
	);
}

type MarketingAd = BrandMarketing["ads"][number];

function AdCard({ ad }: { ad: MarketingAd }) {
	const { replace } = useBrandText();

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
		<Card className="relative h-full">
			<CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
				<Badge variant="secondary">{replace(ad.angle)}</Badge>
				<Button
					className="text-gray-400 hover:text-gray-700"
					onClick={onCopy}
					size="icon-sm"
					title="Copy ad copy"
					variant="ghost"
				>
					<Copy className="h-3.5 w-3.5" />
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				<BrandText
					as="p"
					className="wrap-break-word font-semibold text-gray-950 tracking-tight"
				>
					{ad.headline}
				</BrandText>
				<BrandText
					as="p"
					className="wrap-break-word text-gray-600 text-sm tracking-tight"
				>
					{ad.primaryText}
				</BrandText>
				<span className="inline-flex w-fit items-center rounded-full bg-brand-primary-50 px-3 py-1 font-medium text-brand-primary-700 text-xs">
					{replace(ad.cta)}
				</span>
			</CardContent>
		</Card>
	);
}
