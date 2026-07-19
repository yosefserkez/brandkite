import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Decorative "moodboard in the sky" — tactile brand artifacts (swatch card,
 * type specimen, hex tag, spark tile) taped up around the hero, drifting
 * gently. Pure ornament: hidden from assistive tech, no pointer events.
 */

/** A strip of translucent masking tape pinning a card up. */
function Tape({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"-top-2 -translate-x-1/2 absolute left-1/2 h-4 w-10 rotate-[-4deg] rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
				className
			)}
			style={{
				background: "color-mix(in srgb, var(--landing-cream) 72%, transparent)",
			}}
		/>
	);
}

/**
 * Positions a chip and gives it its slow vertical drift. Entrance rise and
 * infinite drift live on separate nested elements so the transforms compose.
 */
function Drift({
	className,
	delay,
	driftDelay,
	children,
}: {
	className?: string;
	delay: string;
	driftDelay: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("absolute", className)}>
			<div
				className="animate-landing-rise motion-reduce:animate-none"
				style={{ animationDelay: delay }}
			>
				<div
					className="animate-landing-drift motion-reduce:animate-none"
					style={{ animationDelay: driftDelay }}
				>
					{children}
				</div>
			</div>
		</div>
	);
}

const CARD =
	"relative rounded-lg border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-10px_rgba(0,0,0,0.14)]";

export function HeroArtifacts() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 hidden select-none lg:block"
		>
			{/* Swatch card — Pantone-style paint chip */}
			<Drift
				className="top-24 left-[7%] xl:left-[12%]"
				delay="250ms"
				driftDelay="0s"
			>
				<div className={cn(CARD, "w-28 rotate-[-6deg] p-1.5")}>
					<Tape />
					<div className="overflow-hidden rounded-md">
						<div className="h-7 bg-(--landing-sage-deep)" />
						<div className="h-7 bg-(--landing-sage)" />
						<div className="h-7 bg-(--landing-cream)" />
					</div>
					<div className="flex items-center justify-between px-0.5 pt-1.5 pb-0.5 font-mono text-[9px] text-gray-400 uppercase tracking-wide">
						<span>Meadow</span>
						<span>01–03</span>
					</div>
				</div>
			</Drift>

			{/* Type specimen */}
			<Drift
				className="top-20 right-[7%] xl:right-[12%]"
				delay="400ms"
				driftDelay="-3s"
			>
				<div className={cn(CARD, "w-24 rotate-[5deg] px-3 pt-2.5 pb-2")}>
					<Tape className="rotate-[3deg]" />
					<div
						className="font-semibold text-3xl text-gray-900"
						style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}
					>
						Aa
					</div>
					<div className="pt-1 font-mono text-[9px] text-gray-400 uppercase tracking-wide">
						Grotesk
					</div>
				</div>
			</Drift>

			{/* Hex tag */}
			<Drift
				className="top-[56%] left-[9%] xl:left-[14%]"
				delay="550ms"
				driftDelay="-5.5s"
			>
				<span className="inline-flex rotate-[-3deg] items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/90 px-2.5 py-1 font-medium font-mono text-[10px] text-gray-500 shadow-sm">
					<span className="size-2.5 rounded-full bg-(--landing-sage-deep)" />
					#4F7A5E
				</span>
			</Drift>

			{/* Spark tile — the "generated" moment */}
			<Drift
				className="top-[52%] right-[8%] xl:right-[13%]"
				delay="700ms"
				driftDelay="-1.5s"
			>
				<div
					className={cn(
						CARD,
						"flex size-12 rotate-[8deg] items-center justify-center rounded-xl"
					)}
				>
					<svg
						aria-hidden="true"
						className="size-6 text-(--landing-sage-deep)"
						fill="none"
						role="presentation"
						viewBox="0 0 24 24"
					>
						<path
							d="M12 3c.9 4.9 4.1 8.1 9 9-4.9.9-8.1 4.1-9 9-.9-4.9-4.1-8.1-9-9 4.9-.9 8.1-4.1 9-9Z"
							fill="currentColor"
						/>
					</svg>
				</div>
			</Drift>
		</div>
	);
}
