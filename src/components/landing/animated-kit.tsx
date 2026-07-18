import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandPalette } from "../../../convex/modules/colors";
import type { BrandMarketing } from "../../../convex/modules/marketing";
import type { NameModuleData } from "../../../convex/modules/name";
import { useBrandModule } from "../../hooks/useBrandModule";
import { cn } from "../../lib/utils";
import Logo from "../logo";
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
							<h3 className="truncate font-semibold text-2xl text-gray-950 tracking-tight md:text-3xl">
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

				{/* Color palette strip */}
				<div className="border-gray-100 border-b px-6 py-5 md:px-8">
					<Reveal show={step >= STEP_COLORS}>
						<div className="flex overflow-hidden rounded-lg border border-gray-100">
							{colors.map((color) => (
								<div
									className="flex h-16 flex-1 items-end justify-center pb-1.5"
									key={`${color.name}-${color.hex}`}
									style={{ backgroundColor: color.hex }}
								>
									<span className="rounded bg-white/85 px-1.5 py-0.5 font-medium font-mono text-[10px] text-gray-700 uppercase tracking-wide">
										{color.hex}
									</span>
								</div>
							))}
						</div>
					</Reveal>
				</div>

				{/* Marketing ad */}
				<div className="p-6 md:p-8">
					<Reveal show={step >= STEP_AD}>
						{ad ? (
							<div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5">
								<p className="mb-2 font-medium text-[11px] text-gray-400 uppercase tracking-wider">
									Ad · {ad.angle}
								</p>
								<p className="font-semibold text-gray-900 text-lg leading-snug tracking-tight">
									{replaceName(ad.headline, brandName)}
								</p>
								<p className="mt-1.5 text-gray-500 text-sm leading-relaxed">
									{replaceName(ad.primaryText, brandName)}
								</p>
								<div className="mt-4">
									<span
										className="inline-flex items-center rounded-lg px-4 py-2 font-medium text-sm text-white shadow-sm"
										style={{ backgroundColor: primaryHex ?? "#111827" }}
									>
										{replaceName(ad.cta, brandName)}
									</span>
								</div>
							</div>
						) : null}
					</Reveal>
				</div>
			</div>
		</div>
	);
}
