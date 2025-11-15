import { useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTypography } from "../../../convex/modules/typography";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { cn, replaceCompanyName } from "../../lib/utils";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BlockWrapper } from "./BlockWrapper";

const WHITESPACE_PATTERN = /\s/;
const LOADED_GOOGLE_FONT_URLS = new Set<string>();

const STANDARD_FONT_WEIGHTS = [
	{
		label: "Thin",
		fontWeight: 100,
		description:
			"Use for large display text, hero sections, or when creating a delicate, elegant aesthetic. Best for decorative purposes and sparingly in UI.",
	},
	{
		label: "Extralight",
		fontWeight: 200,
		description:
			"Use for large headings, captions, or subtle UI elements. Good for creating hierarchy without heavy emphasis. Works well in minimalist designs.",
	},
	{
		label: "Light",
		fontWeight: 300,
		description:
			"Use for subheadings, captions, or body text in elegant designs. Ideal for creating visual hierarchy while maintaining readability. Common in editorial layouts.",
	},
	{
		label: "Normal",
		fontWeight: 400,
		description:
			"Use for all body text, paragraphs, and general content. This is the default weight for most text. Essential for long-form reading and accessibility.",
	},
	{
		label: "Medium",
		fontWeight: 500,
		description:
			"Use for emphasized text, buttons, navigation items, or subheadings that need subtle distinction. Good for interactive elements and call-to-action text.",
	},
	{
		label: "Semibold",
		fontWeight: 600,
		description:
			"Use for section headings, important labels, or UI elements that need clear emphasis. Ideal for creating strong hierarchy without being overwhelming.",
	},
	{
		label: "Bold",
		fontWeight: 700,
		description:
			"Use for primary headings, page titles, or critical information that must stand out. Standard for creating the strongest text hierarchy in most designs.",
	},
	{
		label: "Extrabold",
		fontWeight: 800,
		description:
			"Use for hero text, large display headings, or when maximum emphasis is needed. Best for impactful statements and attention-grabbing headlines.",
	},
	{
		label: "Black",
		fontWeight: 900,
		description:
			"Use sparingly for maximum impact in hero sections, large display typography, or when creating dramatic contrast. Reserve for the most important messages.",
	},
] as const;

type TypographyModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function TypographyModule({
	companyId,
	className,
}: TypographyModuleProps) {
	const ctx = useBrandModule(companyId, "typography");
	const companyName = useCompanyBrandName(companyId);
	const data = ctx.selected?.data as BrandTypography | undefined;

	const onCopy = () => {
		if (!data) {
			return;
		}
		if (!data.primaryFont) {
			return;
		}
		if (!data.headlineFont) {
			return;
		}
		const safeCompanyName = companyName ?? "";
		const lines = [
			"Typography system",
			replaceCompanyName(data.overview, safeCompanyName),
			"",
			"Guidelines:",
			...data.guidelines.map(
				(line) => `- ${replaceCompanyName(line, safeCompanyName)}`
			),
			"",
			`Primary font: ${data.primaryFont.name}`,
			replaceCompanyName(data.primaryFont.summary, safeCompanyName),
			replaceCompanyName(data.primaryFont.usage, safeCompanyName),
			replaceCompanyName(data.primaryFont.pairing, safeCompanyName),
			"",
			`Headline font: ${data.headlineFont.name}`,
			replaceCompanyName(data.headlineFont.summary, safeCompanyName),
			replaceCompanyName(data.headlineFont.usage, safeCompanyName),
			replaceCompanyName(data.headlineFont.pairing, safeCompanyName),
			"",
			"Weight usage:",
			...STANDARD_FONT_WEIGHTS.map(
				(weight) =>
					`${weight.label} (${weight.fontWeight}): ${replaceCompanyName(weight.description, safeCompanyName)}`
			),
			"",
			replaceCompanyName(data.specimenCopy, safeCompanyName),
		];
		navigator.clipboard.writeText(lines.join("\n"));
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Typography system" />}
		>
			{data && (
				<Card>
					<CardHeader>
						<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
							Typography system
						</p>
						<div className="wrap-break-word text-gray-950 text-sm tracking-tight">
							<p>
								{replaceCompanyName(data?.overview ?? "", companyName ?? "")}
							</p>
							{data ? (
								<p className="pb-4 text-gray-600">
									{replaceCompanyName(
										data?.primaryFont?.summary ?? "",
										companyName ?? ""
									)}
								</p>
							) : null}
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-8">
							<TypographyShowcase companyName={companyName ?? ""} data={data} />
							<TypographyGuidelines
								companyName={companyName ?? ""}
								data={data}
							/>
						</div>
					</CardContent>
				</Card>
			)}
		</BlockWrapper>
	);
}

function TypographyShowcase({
	data,
	companyName,
}: {
	data: BrandTypography;
	companyName: string;
}) {
	const fontWeights = useMemo(
		() => STANDARD_FONT_WEIGHTS.map((w) => w.fontWeight),
		[]
	);
	useEffect(() => {
		loadGoogleFontFamily(data.primaryFont?.name, fontWeights);
		loadGoogleFontFamily(data.headlineFont?.name, fontWeights);
	}, [data.headlineFont?.name, data.primaryFont?.name, fontWeights]);

	const [activeFont, setActiveFont] = useState<"primary" | "headline">(
		"primary"
	);
	const activeFontData =
		activeFont === "primary" ? data.primaryFont : data.headlineFont;
	const fontFamilyStack = buildFontStack(activeFontData.name);
	const fontDescriptor =
		activeFont === "primary" ? "Primary font" : "Headline font";

	return (
		<section>
			<div className="flex flex-wrap items-center justify-between gap-4 pb-6">
				<div className="flex items-start gap-2">
					<div>
						<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
							{fontDescriptor}
						</p>
						<p className="font-semibold text-gray-900 text-lg">
							{activeFontData.name}
						</p>
					</div>
					<Popover>
						<PopoverTrigger asChild>
							<button
								aria-label={`View ${activeFontData.name} details`}
								className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white font-semibold text-gray-500 text-xs transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
								type="button"
							>
								?
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-80 space-y-4 text-left text-sm">
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									Summary
								</p>
								<p className="text-gray-700">
									{replaceCompanyName(activeFontData.summary, companyName)}
								</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									Usage
								</p>
								<p className="text-gray-700">
									{replaceCompanyName(activeFontData.usage, companyName)}
								</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									Pairing
								</p>
								<p className="text-gray-700">
									{replaceCompanyName(activeFontData.pairing, companyName)}
								</p>
							</div>
						</PopoverContent>
					</Popover>
				</div>
				<TypographyFontToggle
					activeFont={activeFont}
					headlineFontName={data.headlineFont.name}
					onChange={setActiveFont}
					primaryFontName={data.primaryFont.name}
				/>
			</div>
			<div className="grid gap-8 md:grid-cols-2 md:gap-0">
				<ul className="space-y-3 text-gray-950 text-lg">
					{STANDARD_FONT_WEIGHTS.map((weight) => (
						<li
							className="group m-0"
							key={`${weight.label}-${weight.fontWeight}`}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="grid w-full grid-cols-2 items-center justify-start bg-transparent p-0 text-left leading-tight outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
										style={{
											fontFamily: fontFamilyStack,
											fontWeight: weight.fontWeight,
										}}
										type="button"
									>
										<span>{weight.label}</span>
										<span className="text-left font-normal text-gray-400 text-xs">
											{weight.fontWeight}
										</span>
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs text-balance">
										<span className="font-medium text-xs tracking-wide">
											{weight.label}:
										</span>{" "}
										{replaceCompanyName(weight.description, companyName)}
									</p>
								</TooltipContent>
							</Tooltip>
						</li>
					))}
				</ul>
				<div
					className="space-y-6 text-left"
					style={{ fontFamily: fontFamilyStack }}
				>
					<div className="space-y-3">
						<div className="flex flex-wrap text-2xl tracking-tight">
							{Array.from({ length: 26 }, (_, i) => {
								const ASCII_UPPERCASE_A = 65;
								const letter = String.fromCharCode(ASCII_UPPERCASE_A + i);
								const shades = [
									"text-gray-950",
									"text-gray-950",
									"text-gray-900",
									"text-gray-900",
									"text-gray-900",
									"text-gray-900",
									"text-gray-800",
									"text-gray-800",
									"text-gray-700",
									"text-gray-700",
									"text-gray-700",
									"text-gray-600",
									"text-gray-600",
									"text-gray-500",
									"text-gray-500",
									"text-gray-500",
									"text-gray-400",
									"text-gray-400",
									"text-gray-400",
									"text-gray-300",
									"text-gray-300",
									"text-gray-200",
									"text-gray-200",
									"text-gray-200",
									"text-gray-100",
									"text-gray-100",
								];
								return (
									<span className={shades[i]} key={letter}>
										{letter}
									</span>
								);
							})}
						</div>
					</div>
					<div className="justify-start space-y-2 font-bold text-gray-400 text-xl tracking-tight">
						<p>0123456789</p>
						<p>@#$%&*</p>
					</div>
					<p className="border-gray-200 border-l-4 pl-4 text-base text-gray-600 leading-relaxed">
						{replaceCompanyName(data.specimenCopy, companyName)}
					</p>
				</div>
			</div>
		</section>
	);
}

function TypographyGuidelines({
	data,
	companyName,
}: {
	data: BrandTypography;
	companyName: string;
}) {
	return (
		<section className="flex flex-col gap-2">
			<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
				Guidelines
			</p>
			<ul className="wrap-break-word flex flex-col gap-2 text-gray-400 text-xs tracking-tight">
				{data.guidelines.map((item) => (
					<li className="" key={item}>
						<span>{replaceCompanyName(item, companyName)}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function TypographyFontToggle({
	activeFont,
	onChange,
	primaryFontName,
	headlineFontName,
}: {
	activeFont: "primary" | "headline";
	onChange: (font: "primary" | "headline") => void;
	primaryFontName: string;
	headlineFontName: string;
}) {
	return (
		<div
			className={
				"inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm"
			}
		>
			<button
				aria-pressed={activeFont === "primary"}
				className={cn(
					"rounded-full px-3 py-1 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-2",
					activeFont === "primary"
						? "bg-gray-900 text-white shadow-sm"
						: "text-gray-500 hover:text-gray-900"
				)}
				onClick={() => onChange("primary")}
				type="button"
			>
				{primaryFontName}
			</button>
			<button
				aria-pressed={activeFont === "headline"}
				className={cn(
					"rounded-full px-3 py-1 font-medium text-xs transition-colors focus-visible:outline-2 focus-visible:outline-gray-900 focus-visible:outline-offset-2",
					activeFont === "headline"
						? "bg-gray-900 text-white shadow-sm"
						: "text-gray-500 hover:text-gray-900"
				)}
				onClick={() => onChange("headline")}
				type="button"
			>
				{headlineFontName}
			</button>
		</div>
	);
}

function buildFontStack(fontName: string): string {
	const trimmed = fontName.trim();
	if (!trimmed) {
		return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
	}
	const normalized = WHITESPACE_PATTERN.test(trimmed)
		? `"${trimmed}"`
		: trimmed;
	return `${normalized}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

function loadGoogleFontFamily(fontName: string, weights: number[]) {
	if (!fontName || typeof document === "undefined") {
		return;
	}
	ensureGoogleFontsPreconnectLinks();
	const fontUrl = buildGoogleFontUrl(fontName, weights);
	if (!fontUrl || LOADED_GOOGLE_FONT_URLS.has(fontUrl)) {
		return;
	}
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = fontUrl;
	document.head.append(link);
	LOADED_GOOGLE_FONT_URLS.add(fontUrl);
}

function buildGoogleFontUrl(
	fontName: string,
	weights: number[]
): string | null {
	const trimmed = fontName.trim();
	if (!trimmed) {
		return null;
	}
	const normalizedFamily = trimmed.replace(/\s+/g, "+");
	const weightSegment =
		weights.length > 0
			? `:wght@${weights.map((weight) => Math.round(weight)).join(";")}`
			: "";
	return `https://fonts.googleapis.com/css2?family=${normalizedFamily}${weightSegment}&display=swap`;
}

function ensureGoogleFontsPreconnectLinks() {
	if (typeof document === "undefined") {
		return;
	}
	const targets: Array<{
		href: string;
		crossOrigin?: "" | "anonymous" | "use-credentials";
	}> = [
		{ href: "https://fonts.googleapis.com" },
		{ href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
	];
	for (const target of targets) {
		const existingLink = document.head.querySelector<HTMLLinkElement>(
			`link[rel="preconnect"][href="${target.href}"]`
		);
		if (existingLink) {
			continue;
		}
		const link = document.createElement("link");
		link.rel = "preconnect";
		link.href = target.href;
		if (target.crossOrigin) {
			link.crossOrigin = target.crossOrigin;
		}
		document.head.append(link);
	}
}
