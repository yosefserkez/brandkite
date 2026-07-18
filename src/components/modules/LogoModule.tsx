import { Authenticated, useQuery } from "convex/react";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LogoModuleData } from "../../../convex/modules/logo";
import { useBrandModule } from "../../hooks/useBrandModule";
import Logo from "../logo";
import { SuspenseCard } from "../suspense-card";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { BlockWrapper } from "./BlockWrapper";

type LogoColorMode = "brand" | "monochrome" | "black_and_white";
type LogoStyle = "auto" | "line_art" | "engraved";

const COLOR_MODE_OPTIONS: { value: LogoColorMode; label: string }[] = [
	{ value: "brand", label: "Brand colors" },
	{ value: "monochrome", label: "Monochrome" },
	{ value: "black_and_white", label: "Black & white" },
];

const STYLE_OPTIONS: { value: LogoStyle; label: string }[] = [
	{ value: "auto", label: "Auto" },
	{ value: "line_art", label: "Line art" },
	{ value: "engraved", label: "Engraved" },
];

type LogoModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function LogoModule({ companyId, className }: LogoModuleProps) {
	const ctx = useBrandModule(companyId, "logo");
	const [colorMode, setColorMode] = useState<LogoColorMode>("brand");
	const [style, setStyle] = useState<LogoStyle>("auto");

	const data = ctx.selected?.data as LogoModuleData | undefined;

	const logoUrl = useQuery(api.r2.getSignedUrl, {
		key: data?.storageKey,
		companyId,
	});

	const onCopy = () => {
		if (logoUrl) {
			navigator.clipboard.writeText(logoUrl);
		}
	};

	const onDownload = () => {
		if (!logoUrl) {
			return;
		}
		const a = document.createElement("a");
		a.href = logoUrl;
		a.download = "logo.svg";
		a.click();
	};

	const onRegenerate = () => ctx.regenerate({ options: { colorMode, style } });

	return (
		<BlockWrapper
			actionHandlers={{ onCopy, onDownload, onRegenerate }}
			actionsVariant="compact"
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard contentHeight={100} headerText="Logo" />}
		>
			<Card className="h-full w-full">
				<CardContent className="h-full w-full">
					{logoUrl && <Logo url={logoUrl} />}
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
								<span className="font-medium text-xs">Colors</span>
								<Select
									onValueChange={(value) =>
										setColorMode(value as LogoColorMode)
									}
									value={colorMode}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{COLOR_MODE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<span className="font-medium text-xs">Style</span>
								<Select
									onValueChange={(value) => setStyle(value as LogoStyle)}
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
