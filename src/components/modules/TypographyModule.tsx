import { useEffect, useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTypography } from "../../../convex/modules/typography";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { cn, replaceCompanyName } from "../../lib/utils";

const WHITESPACE_PATTERN = /\s/;
const LOADED_GOOGLE_FONT_URLS = new Set<string>();

import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { BlockWrapper } from "./BlockWrapper";

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

	const sortedWeights = useMemo(() => {
		if (!data) {
			return [] as BrandTypography["weights"];
		}
		return [...data.weights].sort((a, b) => a.fontWeight - b.fontWeight);
	}, [data]);

	const onCopy = () => {
		if (!data) {
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
			...sortedWeights.map(
				(weight) =>
					`${weight.label} (${weight.fontWeight}): ${replaceCompanyName(weight.description, safeCompanyName)}`
			),
			"",
			"Character set:",
			`Uppercase: ${data.characterSet.uppercase}`,
			`Lowercase: ${data.characterSet.lowercase}`,
			`Numerals: ${data.characterSet.numerals}`,
			`Punctuation: ${data.characterSet.punctuation}`,
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
			<Card>
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Typography system
					</p>
					<div className="wrap-break-word text-gray-950 text-sm tracking-tight">
						<p>{replaceCompanyName(data?.overview ?? "", companyName ?? "")}</p>
						{data ? (
							<p className="pb-4 text-gray-600">
								{replaceCompanyName(
									data.primaryFont.summary,
									companyName ?? ""
								)}
							</p>
						) : null}
					</div>
				</CardHeader>
				<CardContent>
					{data ? (
						<TypographyContent
							companyName={companyName ?? ""}
							data={data}
							sortedWeights={sortedWeights}
						/>
					) : (
						<SuspenseCard headerText="Typography system" />
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}

function TypographyContent({
	data,
	companyName,
	sortedWeights,
}: {
	data: BrandTypography;
	companyName: string;
	sortedWeights: BrandTypography["weights"];
}) {
	return (
		<div className="space-y-8">
			<TypographyShowcase
				companyName={companyName}
				data={data}
				sortedWeights={sortedWeights}
			/>
			<TypographyGuidelines companyName={companyName} data={data} />
		</div>
	);
}

function TypographyShowcase({
	data,
	companyName,
	sortedWeights,
}: {
	data: BrandTypography;
	companyName: string;
	sortedWeights: BrandTypography["weights"];
}) {
	const fontWeights = useMemo(
		() => extractFontWeights(sortedWeights),
		[sortedWeights]
	);
	useEffect(() => {
		loadGoogleFontFamily(data.primaryFont.name, fontWeights);
		loadGoogleFontFamily(data.headlineFont.name, fontWeights);
	}, [data.headlineFont.name, data.primaryFont.name, fontWeights]);

	const [activeFont, setActiveFont] = useState<"primary" | "headline">(
		"primary"
	);
	const specimenCopy = replaceCompanyName(data.specimenCopy, companyName);
	const activeFontData =
		activeFont === "primary" ? data.primaryFont : data.headlineFont;
	const fontFamilyStack = useMemo(
		() => buildFontStack(activeFontData.name),
		[activeFontData.name]
	);
	const fontDescriptor =
		activeFont === "primary" ? "Primary font" : "Headline font";
	const activeFontSummary = replaceCompanyName(
		activeFontData.summary,
		companyName
	);
	const activeFontUsage = replaceCompanyName(activeFontData.usage, companyName);
	const activeFontPairing = replaceCompanyName(
		activeFontData.pairing,
		companyName
	);

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
								<p className="text-gray-700">{activeFontSummary}</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									Usage
								</p>
								<p className="text-gray-700">{activeFontUsage}</p>
							</div>
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									Pairing
								</p>
								<p className="text-gray-700">{activeFontPairing}</p>
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
			<div className="grid grid-cols-2">
				<ul className="space-y-3 text-gray-950 text-lg">
					{sortedWeights.map((weight) => (
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
						<div className="flex flex-nowrap text-2xl tracking-tight">
							<span className="text-gray-950">A</span>
							<span className="text-gray-950">B</span>
							<span className="text-gray-900">C</span>
							<span className="text-gray-900">D</span>
							<span className="text-gray-900">E</span>
							<span className="text-gray-900">F</span>
							<span className="text-gray-800">G</span>
							<span className="text-gray-800">H</span>
							<span className="text-gray-700">I</span>
							<span className="text-gray-700">J</span>
							<span className="text-gray-700">K</span>
							<span className="text-gray-600">L</span>
							<span className="text-gray-600">M</span>
							<span className="text-gray-500">N</span>
							<span className="text-gray-500">O</span>
							<span className="text-gray-500">P</span>
							<span className="text-gray-400">Q</span>
							<span className="text-gray-400">R</span>
							<span className="text-gray-400">S</span>
							<span className="text-gray-300">T</span>
							<span className="text-gray-300">U</span>
							<span className="text-gray-200">V</span>
							<span className="text-gray-200">W</span>
							<span className="text-gray-200">X</span>
							<span className="text-gray-100">Y</span>
							<span className="text-gray-100">Z</span>
						</div>
					</div>
					<div className="justify-start space-y-2 font-bold text-gray-400 text-xl tracking-tight">
						<p>0123456789</p>
						<p>@#$%&*</p>
					</div>
					<p className="border-gray-200 border-l-4 pl-4 text-base text-gray-600 leading-relaxed">
						{specimenCopy}
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
			<ul className="wrap-break-word text-gray-400 text-xs tracking-tight">
				{data.guidelines.map((item) => (
					<li className="flex gap-2" key={item}>
						<span>- {replaceCompanyName(item, companyName)}</span>
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

function extractFontWeights(weights: BrandTypography["weights"]): number[] {
	const unique = new Set<number>();
	for (const weight of weights) {
		if (
			typeof weight.fontWeight === "number" &&
			Number.isFinite(weight.fontWeight)
		) {
			unique.add(weight.fontWeight);
		}
	}
	return Array.from(unique).sort((a, b) => a - b);
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
