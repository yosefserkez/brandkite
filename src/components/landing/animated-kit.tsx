import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandPalette } from "../../../convex/modules/colors";
import type { BrandMarketing } from "../../../convex/modules/marketing";
import type { NameModuleData } from "../../../convex/modules/name";
import { useBrandModule } from "../../hooks/useBrandModule";
import { cn } from "../../lib/utils";
import Logo from "../logo";
import {
	AD_PLACEMENTS,
	AdMockup,
	type AdPlacement,
} from "../modules/AdMockups";
import { Callout } from "./callout";

// Reveal order for the build sequence.
const STEP_NAME = 1;
const STEP_LOGO = 2;
const STEP_COLORS = 3;
const STEP_TAGLINE = 4;
const STEP_AD = 5;
const STEP_COUNT = STEP_AD;
const FIRST_STEP_DELAY_MS = 350;
const STEP_DELAY_MS = 650;

type AnimatedKitProps = {
	companyId: Id<"companies">;
	fallbackName: string;
	logoUrl: string;
};

function replaceName(text: string | undefined, name: string): string {
	if (!text) {
		return "";
	}
	return text.replace(/{company_name}/g, name);
}

/** Reveals its children with a soft fade / rise once `show` is true. */
function Reveal({
	show,
	children,
	className,
}: {
	show: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
				show
					? "translate-y-0 opacity-100 blur-0"
					: "translate-y-3 opacity-0 blur-[2px]",
				className
			)}
		>
			{children}
		</div>
	);
}

export function AnimatedKit({
	companyId,
	fallbackName,
	logoUrl,
}: AnimatedKitProps) {
	const nameCtx = useBrandModule(companyId, "name");
	const colorsCtx = useBrandModule(companyId, "colors");
	const taglineCtx = useBrandModule(companyId, "tagline");
	const marketingCtx = useBrandModule(companyId, "marketing");

	const nameData = nameCtx.selected?.data as NameModuleData | undefined;
	const palette = colorsCtx.selected?.data as BrandPalette | undefined;
	const taglineData = taglineCtx.selected?.data as
		| { tagline: string }
		| undefined;
	const marketing = marketingCtx.selected?.data as BrandMarketing | undefined;

	const brandName = nameData?.[0]?.name?.name?.trim() || fallbackName;
	const colors = palette?.colors ?? [];
	const primaryHex = colors[0]?.hex;
	const tagline = replaceName(taglineData?.tagline, brandName);
	const ad = marketing?.ads?.[0];

	// Interactive: pick a brand color / font and watch the marketing restyle live.
	const [pickedColor, setPickedColor] = useState<string | null>(null);
	const activeColor = pickedColor ?? primaryHex ?? "#111827";
	const [font, setFont] = useState<"Inter" | "Space Grotesk">("Space Grotesk");
	const headingFont = `"${font}", system-ui, sans-serif`;
	const [placement, setPlacement] = useState<AdPlacement>("instagram");

	const ready = Boolean(
		logoUrl && colors.length > 0 && tagline && ad && brandName
	);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const [inView, setInView] = useState(false);
	const [step, setStep] = useState(0);

	// Start the build sequence when the kit scrolls into view.
	useEffect(() => {
		const node = containerRef.current;
		if (!node || inView) {
			return;
		}
		if (typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setInView(true);
						observer.disconnect();
						break;
					}
				}
			},
			{ threshold: 0.3 }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [inView]);

	// Staggered reveal, one piece at a time.
	useEffect(() => {
		if (!(inView && ready) || step >= STEP_COUNT) {
			return;
		}
		const delay = step === 0 ? FIRST_STEP_DELAY_MS : STEP_DELAY_MS;
		const timer = setTimeout(() => setStep((prev) => prev + 1), delay);
		return () => clearTimeout(timer);
	}, [inView, ready, step]);

	const building = inView && step < STEP_COUNT;

	return (
		<div className="relative mx-auto max-w-5xl px-4" ref={containerRef}>
			{/* Build status caption */}
			<div className="mb-5 flex items-center justify-center gap-2 text-gray-400 text-xs">
				<span
					className={cn(
						"inline-block size-1.5 rounded-full transition-colors duration-500",
						building ? "animate-pulse bg-gray-400" : "bg-gray-300"
					)}
				/>
				<span>
					{building
						? "Assembling your brand kit…"
						: "One prompt. A complete, consistent brand."}
				</span>
			</div>

			{/* Callouts (desktop only) */}
			<Callout className="top-24 left-0" show={step >= STEP_LOGO} side="left">
				AI-generated SVG logo
			</Callout>
			<Callout
				className="top-28 right-0"
				show={step >= STEP_TAGLINE}
				side="right"
			>
				Voice &amp; messaging
			</Callout>
			<Callout
				className="top-1/2 left-0"
				show={step >= STEP_COLORS}
				side="left"
			>
				On-brand color palette
			</Callout>
			<Callout
				className="right-0 bottom-16"
				show={step >= STEP_AD}
				side="right"
			>
				Ready-to-run marketing
			</Callout>

			{/* The brand board artifact */}
			<div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(0,0,0,0.12)]">
				{/* Header: logo + name + tagline */}
				<div className="flex items-center gap-5 border-gray-100 border-b p-6 md:p-8">
					<Reveal
						className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-3 md:size-24"
						show={step >= STEP_LOGO}
					>
						{logoUrl ? <Logo url={logoUrl} /> : null}
					</Reveal>
					<div className="min-w-0 flex-1">
						<Reveal show={step >= STEP_NAME}>
							<h3
								className="truncate font-semibold text-2xl text-gray-950 tracking-tight md:text-3xl"
								style={{ fontFamily: headingFont }}
							>
								{brandName}
							</h3>
						</Reveal>
						<Reveal className="mt-1.5" show={step >= STEP_TAGLINE}>
							<p className="text-balance text-gray-500 text-sm md:text-base">
								{tagline}
							</p>
						</Reveal>
					</div>
				</div>

				{/* Color palette strip — interactive */}
				<div className="border-gray-100 border-b px-6 py-5 md:px-8">
					<Reveal show={step >= STEP_COLORS}>
						<div className="flex overflow-hidden rounded-lg border border-gray-100">
							{colors.map((color) => {
								const isActive = activeColor === color.hex;
								return (
									<button
										aria-label={`Use ${color.name}`}
										aria-pressed={isActive}
										className={cn(
											"group/swatch relative flex h-16 flex-1 items-end justify-center pb-1.5 outline-none transition-[flex] duration-300 focus-visible:ring-2 focus-visible:ring-gray-900/70 focus-visible:ring-inset",
											isActive && "flex-[1.4]"
										)}
										key={`${color.name}-${color.hex}`}
										onClick={() => setPickedColor(color.hex)}
										style={{ backgroundColor: color.hex }}
										type="button"
									>
										<span className="rounded bg-white/85 px-1.5 py-0.5 font-medium font-mono text-[10px] text-gray-700 uppercase tracking-wide">
											{color.hex}
										</span>
										{isActive ? (
											<span className="absolute inset-0 ring-2 ring-gray-900/70 ring-inset" />
										) : null}
									</button>
								);
							})}
						</div>
						<div className="mt-2.5 flex items-center justify-center gap-3">
							<span className="text-[11px] text-gray-400">
								Pick a color or font — your marketing updates with it.
							</span>
							<span className="inline-flex rounded-md border border-gray-200 p-0.5">
								{(["Space Grotesk", "Inter"] as const).map((f) => (
									<button
										className={cn(
											"rounded px-2 py-0.5 text-[11px] transition-colors",
											font === f
												? "bg-gray-900 text-white"
												: "text-gray-500 hover:text-gray-900"
										)}
										key={f}
										onClick={() => setFont(f)}
										style={{ fontFamily: `"${f}", sans-serif` }}
										type="button"
									>
										{f === "Space Grotesk" ? "Grotesk" : "Inter"}
									</button>
								))}
							</span>
						</div>
					</Reveal>
				</div>

				{/* Marketing ad — framed as the real placement it will run in */}
				<div className="p-6 md:p-8">
					<Reveal show={step >= STEP_AD}>
						{ad ? (
							<div
								// Scope the live brand tokens so the color/font pickers
								// restyle the mock without touching the page.
								style={
									{
										"--brand-primary-500": activeColor,
										"--font-brand-headline": headingFont,
									} as CSSProperties
								}
							>
								<div className="mb-4 flex flex-wrap justify-center gap-1">
									{AD_PLACEMENTS.map((option) => (
										<button
											aria-pressed={placement === option.value}
											className={cn(
												"rounded-full px-2.5 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
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
								</div>
								<AdMockup
									ad={{
										brandName,
										headline: replaceName(ad.headline, brandName),
										primaryText: replaceName(ad.primaryText, brandName),
										cta: replaceName(ad.cta, brandName),
									}}
									className={cn(
										"mx-auto",
										placement === "tiktok" ? "max-w-[250px]" : "max-w-sm"
									)}
									logoUrl={logoUrl || undefined}
									placement={placement}
									seed={`hero-${ad.headline}`}
								/>
							</div>
						) : null}
					</Reveal>
				</div>
			</div>
		</div>
	);
}
