import { Authenticated } from "convex/react";
import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandWebsite } from "../../../convex/modules/website";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
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
import { BlockWrapper } from "./BlockWrapper";

type WebsiteStyle = "benefit" | "minimal" | "bold";

const STYLE_OPTIONS: { value: WebsiteStyle; label: string }[] = [
	{ value: "benefit", label: "Benefit-led" },
	{ value: "minimal", label: "Minimal" },
	{ value: "bold", label: "Bold" },
];

type WebsiteModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function WebsiteModule({
	companyId,
	className,
}: WebsiteModuleProps) {
	const ctx = useBrandModule(companyId, "website");
	const [style, setStyle] = useState<WebsiteStyle>("benefit");
	const { replace } = useBrandText();

	const data = ctx.selected?.data as BrandWebsite | undefined;

	const onRegenerate = () => ctx.regenerate({ options: { style } });

	const onCopyAll = () => {
		if (!data) {
			return;
		}
		const lines = [
			replace(data.hero.headline),
			replace(data.hero.subheadline),
			"",
			...data.features.flatMap((feature) => [
				replace(feature.title),
				replace(feature.description),
				"",
			]),
			replace(data.cta.headline),
			`CTA: ${replace(data.cta.buttonText)}`,
		];
		navigator.clipboard
			.writeText(lines.join("\n").trim())
			.then(() => toast.success("Copied"));
	};

	return (
		<BlockWrapper
			actionHandlers={{ onRegenerate }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Website" />}
		>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-2">
						<p className="wrap-break-word col-span-full place-self-stretch font-medium text-[11px] text-gray-400 uppercase tracking-[0.08em]">
							Website
						</p>
						{data && (
							<button
								aria-label="Copy landing page copy"
								className="text-gray-300 opacity-0 transition hover:text-gray-600 group-hover:opacity-100"
								onClick={onCopyAll}
								title="Copy landing page copy"
								type="button"
							>
								<Copy className="h-3.5 w-3.5" />
							</button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{data && (
						<div className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 md:p-10">
							{/* Hero */}
							<div className="space-y-2 text-center">
								<BrandText
									as="p"
									className="wrap-break-word font-semibold text-2xl text-gray-900 tracking-tight md:text-3xl"
								>
									{data.hero.headline}
								</BrandText>
								<BrandText
									as="p"
									className="wrap-break-word text-gray-500 text-sm md:text-base"
								>
									{data.hero.subheadline}
								</BrandText>
							</div>
							{/* Features */}
							<div className="grid gap-4 md:grid-cols-3">
								{data.features.map((feature, index) => (
									<div
										className="rounded-lg border border-gray-200 bg-gray-50 p-4"
										key={`${feature.title}-${index}`}
									>
										<BrandText
											as="p"
											className="wrap-break-word font-semibold text-gray-900 text-sm"
										>
											{feature.title}
										</BrandText>
										<BrandText
											as="p"
											className="wrap-break-word pt-1.5 text-gray-500 text-sm leading-relaxed"
										>
											{feature.description}
										</BrandText>
									</div>
								))}
							</div>
							{/* CTA */}
							<div className="space-y-3 text-center">
								<BrandText
									as="p"
									className="wrap-break-word font-medium text-base text-gray-900"
								>
									{data.cta.headline}
								</BrandText>
								<span className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 font-medium text-sm text-white">
									{replace(data.cta.buttonText)}
								</span>
							</div>
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
								<span className="font-medium text-xs">Style</span>
								<Select
									onValueChange={(value) => setStyle(value as WebsiteStyle)}
									value={style}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STYLE_OPTIONS.map((option) => (
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
