import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/utils";

type AdPreviewProps = {
	brandName: string;
	headline: string;
	primaryText: string;
	cta: string;
	angle?: string;
	/** Brand accent for the CTA; falls back to near-black. */
	accentColor?: string;
	/** Heading font family for the headline (brand typography). */
	headingFontFamily?: string;
	/** Optional brand mark rendered inside the avatar circle. */
	logo?: ReactNode;
	/** Optional control (e.g. copy button) rendered at the end of the header row. */
	headerAction?: ReactNode;
	className?: string;
	style?: CSSProperties;
};

const FALLBACK_ACCENT = "#111827";

/**
 * A generated ad, framed the way it will actually run: profile header,
 * copy, and CTA bar like a social feed placement. The whole unit is a
 * non-interactive artifact (a preview of the deliverable), not app UI.
 */
export function AdPreview({
	brandName,
	headline,
	primaryText,
	cta,
	angle,
	accentColor,
	headingFontFamily,
	logo,
	headerAction,
	className,
	style,
}: AdPreviewProps) {
	const accent = accentColor ?? FALLBACK_ACCENT;
	const initial = brandName.trim().charAt(0).toUpperCase() || "B";

	return (
		<figure
			className={cn(
				"flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs",
				className
			)}
			style={style}
		>
			<figcaption className="sr-only">
				Ad preview for {brandName}
				{angle ? ` — ${angle} angle` : ""}
			</figcaption>
			{/* Profile header, like a feed placement */}
			<div className="flex items-center gap-2.5 px-4 pt-3.5">
				<span
					aria-hidden="true"
					className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-50 font-semibold text-[13px] text-gray-700"
				>
					{logo ?? initial}
				</span>
				<span className="min-w-0 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{brandName}
					</span>
					<span className="block text-[11px] text-gray-400">Sponsored</span>
				</span>
				<span className="ml-auto flex shrink-0 items-center gap-1 self-start">
					{angle ? (
						<span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-400">
							{angle}
						</span>
					) : null}
					{headerAction}
				</span>
			</div>
			{/* Ad copy */}
			<div className="flex-1 px-4 pt-3 pb-4">
				<p
					className="wrap-break-word font-semibold text-[15px] text-gray-900 leading-snug tracking-tight"
					style={
						headingFontFamily ? { fontFamily: headingFontFamily } : undefined
					}
				>
					{headline}
				</p>
				<p className="wrap-break-word mt-1.5 text-gray-600 text-sm leading-relaxed">
					{primaryText}
				</p>
			</div>
			{/* CTA bar, like the footer of a feed ad */}
			<div className="flex items-center justify-between gap-3 border-gray-100 border-t bg-gray-50/70 px-4 py-2.5">
				<span className="truncate text-gray-400 text-xs lowercase">
					{brandName}
				</span>
				<span
					aria-hidden="true"
					className="shrink-0 rounded-md px-3.5 py-1.5 font-medium text-sm text-white transition-colors duration-500"
					style={{ backgroundColor: accent }}
				>
					{cta}
				</span>
			</div>
		</figure>
	);
}
