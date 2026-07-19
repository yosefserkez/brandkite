import {
	Bookmark,
	ChevronRight,
	Globe,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Music2,
	Repeat2,
	Send,
	Share2,
	ThumbsUp,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type AdPlacement =
	| "instagram"
	| "facebook"
	| "linkedin"
	| "x"
	| "tiktok"
	| "google";

export const AD_PLACEMENTS: { value: AdPlacement; label: string }[] = [
	{ value: "instagram", label: "Instagram" },
	{ value: "facebook", label: "Facebook" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "x", label: "X" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "google", label: "Google" },
];

export type AdMockupContent = {
	brandName: string;
	headline: string;
	primaryText: string;
	cta: string;
};

type AdMockupProps = {
	placement: AdPlacement;
	ad: AdMockupContent;
	/** Live logo URL from the brand store; falls back to a monogram. */
	logoUrl?: string | null;
	/** Stable seed for the stock-photo creative (varies per ad). */
	seed: string;
	className?: string;
};

/**
 * A generated ad rendered inside an authentic mock of a real placement.
 * The whole unit is a non-interactive artifact (a preview of the
 * deliverable), not app UI — platform chrome uses each network's own
 * conventions, so those colors are intentionally not brand tokens.
 */
export function AdMockup({
	placement,
	ad,
	logoUrl,
	seed,
	className,
}: AdMockupProps) {
	const Placement = PLACEMENT_COMPONENTS[placement];
	return (
		<figure
			className={cn(
				"overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs",
				placement === "tiktok" && "bg-gray-950",
				className
			)}
		>
			<figcaption className="sr-only">
				{AD_PLACEMENTS.find((p) => p.value === placement)?.label} ad preview for{" "}
				{ad.brandName}
			</figcaption>
			<Placement ad={ad} logoUrl={logoUrl} seed={seed} />
		</figure>
	);
}

type PlacementProps = {
	ad: AdMockupContent;
	logoUrl?: string | null;
	seed: string;
};

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const NON_ALPHANUMERIC = /[^a-z0-9]/g;

export function slugify(name: string): string {
	return name.trim().toLowerCase().replace(NON_ALPHANUMERIC, "") || "yourbrand";
}

function creativeUrl(seed: string, width: number, height: number): string {
	return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

type BrandMarkProps = {
	logoUrl?: string | null;
	brandName: string;
	shape?: "circle" | "square";
	className?: string;
};

/** Live brand mark: contained logo image, monogram fallback. */
export function BrandMark({
	logoUrl,
	brandName,
	shape = "circle",
	className,
}: BrandMarkProps) {
	const initial = brandName.trim().charAt(0).toUpperCase() || "B";
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/10",
				shape === "circle" ? "rounded-full" : "rounded-md",
				className
			)}
		>
			{logoUrl ? (
				<img
					alt=""
					className="h-full w-full object-contain p-1"
					height="40"
					loading="lazy"
					src={logoUrl}
					width="40"
				/>
			) : (
				<span className="font-semibold text-[13px] text-gray-700">
					{initial}
				</span>
			)}
		</span>
	);
}

type AdCreativeProps = {
	seed: string;
	width: number;
	height: number;
	/** Headline overlaid on the image, set in the brand headline font. */
	headline?: string;
	headlinePosition?: "bottom" | "center";
	logoUrl?: string | null;
	brandName: string;
	showLogoChip?: boolean;
	className?: string;
};

/**
 * The campaign creative: a stock photo duotoned with the live brand
 * primary via mix-blend-color, so it recolors when the palette changes.
 */
export function AdCreative({
	seed,
	width,
	height,
	headline,
	headlinePosition = "bottom",
	logoUrl,
	brandName,
	showLogoChip = true,
	className,
}: AdCreativeProps) {
	const initial = brandName.trim().charAt(0).toUpperCase() || "B";
	return (
		<div
			className={cn(
				"relative isolate w-full overflow-hidden bg-gray-100",
				className
			)}
		>
			<img
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
				height={height}
				loading="lazy"
				src={creativeUrl(seed, width, height)}
				width={width}
			/>
			<div
				aria-hidden="true"
				className="absolute inset-0 opacity-85 mix-blend-color"
				style={{ backgroundColor: "var(--brand-primary-500, #4B5563)" }}
			/>
			{headline ? (
				<div
					className={cn(
						"absolute inset-0 flex p-4",
						headlinePosition === "center"
							? "items-center pr-14"
							: "items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent"
					)}
				>
					<p
						className={cn(
							"wrap-break-word text-balance font-semibold text-white leading-snug",
							headlinePosition === "center"
								? "text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
								: "text-lg drop-shadow-sm"
						)}
						style={{ fontFamily: "var(--font-brand-headline, inherit)" }}
					>
						{headline}
					</p>
				</div>
			) : null}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 ring-1 ring-black/5 ring-inset"
			/>
			{showLogoChip ? (
				<span
					aria-hidden="true"
					className="absolute top-3 left-3 flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/95 shadow-sm"
				>
					{logoUrl ? (
						<img
							alt=""
							className="h-full w-full object-contain p-1.5"
							height="36"
							loading="lazy"
							src={logoUrl}
							width="36"
						/>
					) : (
						<span
							className="font-semibold text-gray-800 text-sm"
							style={{ fontFamily: "var(--font-brand-headline, inherit)" }}
						>
							{initial}
						</span>
					)}
				</span>
			) : null}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Instagram                                                           */
/* ------------------------------------------------------------------ */

function InstagramAd({ ad, logoUrl, seed }: PlacementProps) {
	const handle = slugify(ad.brandName);
	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-2.5 px-3 py-2.5">
				<BrandMark
					brandName={ad.brandName}
					className="size-8"
					logoUrl={logoUrl}
				/>
				<span className="min-w-0 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{handle}
					</span>
					<span className="block text-[11px] text-gray-400">Sponsored</span>
				</span>
				<MoreHorizontal className="ml-auto size-4 shrink-0 text-gray-400" />
			</div>
			<AdCreative
				brandName={ad.brandName}
				className="aspect-square"
				headline={ad.headline}
				height={720}
				logoUrl={logoUrl}
				seed={seed}
				width={720}
			/>
			<div className="flex items-center justify-between border-gray-100 border-b px-3 py-2.5">
				<span className="font-semibold text-[#0095F6] text-[13px]">
					{ad.cta}
				</span>
				<ChevronRight className="size-4 text-[#0095F6]" />
			</div>
			<div className="flex items-center gap-4 px-3 pt-2.5 text-gray-800">
				<Heart className="size-[22px]" strokeWidth={1.75} />
				<MessageCircle className="size-[22px]" strokeWidth={1.75} />
				<Send className="size-[22px]" strokeWidth={1.75} />
				<Bookmark className="ml-auto size-[22px]" strokeWidth={1.75} />
			</div>
			<p className="wrap-break-word px-3 pt-2 pb-3.5 text-[13px] text-gray-800 leading-normal">
				<span className="font-semibold">{handle}</span> {ad.primaryText}
			</p>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Facebook                                                            */
/* ------------------------------------------------------------------ */

function FacebookAd({ ad, logoUrl, seed }: PlacementProps) {
	const domain = `${slugify(ad.brandName)}.com`;
	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-2.5 px-3 py-2.5">
				<BrandMark
					brandName={ad.brandName}
					className="size-9"
					logoUrl={logoUrl}
				/>
				<span className="min-w-0 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{ad.brandName}
					</span>
					<span className="flex items-center gap-1 text-[11px] text-gray-500">
						Sponsored
						<Globe className="size-3" />
					</span>
				</span>
				<MoreHorizontal className="ml-auto size-4 shrink-0 text-gray-400" />
			</div>
			<p className="wrap-break-word px-3 pb-2.5 text-gray-800 text-sm leading-normal">
				{ad.primaryText}
			</p>
			<AdCreative
				brandName={ad.brandName}
				className="aspect-[1.91/1]"
				height={420}
				logoUrl={logoUrl}
				seed={seed}
				width={800}
			/>
			<div className="flex items-center gap-3 bg-gray-50 px-3 py-2.5">
				<span className="min-w-0 flex-1 leading-tight">
					<span className="block text-[10px] text-gray-500 uppercase tracking-wide">
						{domain}
					</span>
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{ad.headline}
					</span>
				</span>
				<span className="shrink-0 rounded-md bg-gray-200 px-3 py-1.5 font-semibold text-[13px] text-gray-800">
					{ad.cta}
				</span>
			</div>
			<div className="flex items-center justify-around border-gray-100 border-t px-3 py-2 text-gray-500">
				<span className="flex items-center gap-1.5 font-medium text-[13px]">
					<ThumbsUp className="size-4" /> Like
				</span>
				<span className="flex items-center gap-1.5 font-medium text-[13px]">
					<MessageCircle className="size-4" /> Comment
				</span>
				<span className="flex items-center gap-1.5 font-medium text-[13px]">
					<Share2 className="size-4" /> Share
				</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* LinkedIn                                                            */
/* ------------------------------------------------------------------ */

function LinkedInAd({ ad, logoUrl, seed }: PlacementProps) {
	return (
		<div className="flex flex-col">
			<div className="flex items-start gap-2.5 px-3 py-2.5">
				<BrandMark
					brandName={ad.brandName}
					className="size-10"
					logoUrl={logoUrl}
					shape="square"
				/>
				<span className="min-w-0 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{ad.brandName}
					</span>
					<span className="block text-[11px] text-gray-500">
						2,417 followers
					</span>
					<span className="block text-[11px] text-gray-500">Promoted</span>
				</span>
				<MoreHorizontal className="ml-auto size-4 shrink-0 text-gray-400" />
			</div>
			<p className="wrap-break-word px-3 pb-2.5 text-[13px] text-gray-800 leading-normal">
				{ad.primaryText}
			</p>
			<AdCreative
				brandName={ad.brandName}
				className="aspect-[1.91/1]"
				height={420}
				logoUrl={logoUrl}
				seed={seed}
				width={800}
			/>
			<div className="flex items-center gap-3 bg-gray-50 px-3 py-2.5">
				<span className="wrap-break-word min-w-0 flex-1 font-semibold text-[13px] text-gray-900 leading-snug">
					{ad.headline}
				</span>
				<span className="shrink-0 rounded-full border border-[#0A66C2] px-3.5 py-1 font-semibold text-[#0A66C2] text-[13px]">
					{ad.cta}
				</span>
			</div>
			<div className="flex items-center justify-around border-gray-100 border-t px-3 py-2 text-gray-500">
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<ThumbsUp className="size-4" /> Like
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<MessageCircle className="size-4" /> Comment
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<Repeat2 className="size-4" /> Repost
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<Send className="size-4" /> Send
				</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* X                                                                   */
/* ------------------------------------------------------------------ */

function XAd({ ad, logoUrl, seed }: PlacementProps) {
	const handle = slugify(ad.brandName);
	return (
		<div className="flex gap-2.5 p-3">
			<BrandMark
				brandName={ad.brandName}
				className="size-9"
				logoUrl={logoUrl}
			/>
			<div className="min-w-0 flex-1">
				<p className="flex min-w-0 items-baseline gap-1 text-[13px] leading-tight">
					<span className="truncate font-bold text-gray-900">
						{ad.brandName}
					</span>
					<span className="truncate text-gray-500">@{handle}</span>
					<span className="ml-auto shrink-0 text-[11px] text-gray-500">Ad</span>
				</p>
				<p className="wrap-break-word mt-0.5 text-[13px] text-gray-900 leading-normal">
					{ad.primaryText}
				</p>
				<div className="mt-2.5 overflow-hidden rounded-2xl border border-gray-200">
					<AdCreative
						brandName={ad.brandName}
						className="aspect-[1.91/1]"
						height={420}
						logoUrl={logoUrl}
						seed={seed}
						width={800}
					/>
					<div className="border-gray-200 border-t px-3 py-2 leading-tight">
						<p className="text-[11px] text-gray-500">{handle}.com</p>
						<p className="wrap-break-word truncate text-[13px] text-gray-900">
							{ad.headline}
						</p>
					</div>
				</div>
				<div className="mt-2 flex items-center justify-between pr-6 text-gray-500">
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<MessageCircle className="size-4" /> 48
					</span>
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<Repeat2 className="size-4" /> 112
					</span>
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<Heart className="size-4" /> 630
					</span>
					<Share2 className="size-4" />
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* TikTok                                                              */
/* ------------------------------------------------------------------ */

function TikTokAd({ ad, logoUrl, seed }: PlacementProps) {
	const handle = slugify(ad.brandName);
	return (
		<div className="relative aspect-[9/16] text-white">
			<AdCreative
				brandName={ad.brandName}
				className="absolute inset-0 h-full"
				headline={ad.headline}
				headlinePosition="center"
				height={960}
				logoUrl={logoUrl}
				seed={seed}
				showLogoChip={false}
				width={540}
			/>
			<div
				aria-hidden="true"
				className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent"
			/>
			<div className="absolute right-2 bottom-28 flex flex-col items-center gap-3.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
				<BrandMark
					brandName={ad.brandName}
					className="size-9 ring-2 ring-white"
					logoUrl={logoUrl}
				/>
				<span className="flex flex-col items-center gap-0.5">
					<Heart className="size-6" fill="currentColor" strokeWidth={0} />
					<span className="font-semibold text-[10px] tabular-nums">23.4K</span>
				</span>
				<span className="flex flex-col items-center gap-0.5">
					<MessageCircle
						className="size-6"
						fill="currentColor"
						strokeWidth={0}
					/>
					<span className="font-semibold text-[10px] tabular-nums">482</span>
				</span>
				<span className="flex flex-col items-center gap-0.5">
					<Bookmark className="size-6" fill="currentColor" strokeWidth={0} />
					<span className="font-semibold text-[10px] tabular-nums">1,208</span>
				</span>
				<span className="flex flex-col items-center gap-0.5">
					<Share2 className="size-6" strokeWidth={2.25} />
					<span className="font-semibold text-[10px] tabular-nums">310</span>
				</span>
			</div>
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8 pr-14">
				<p className="flex items-center gap-1.5 font-semibold text-[13px]">
					@{handle}
					<span className="rounded-sm bg-white/25 px-1 py-px text-[9px] uppercase tracking-wide">
						Sponsored
					</span>
				</p>
				<p className="wrap-break-word mt-1 line-clamp-2 text-[12px] text-white/90 leading-normal">
					{ad.primaryText}
				</p>
				<p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-white/80">
					<Music2 className="size-3.5 shrink-0" />
					<span className="truncate">{ad.brandName} · Original audio</span>
				</p>
				<span className="mt-2.5 block rounded-md bg-[#FE2C55] py-2 text-center font-semibold text-[13px]">
					{ad.cta}
				</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Google Search                                                       */
/* ------------------------------------------------------------------ */

function GoogleAd({ ad, logoUrl }: PlacementProps) {
	const domain = `${slugify(ad.brandName)}.com`;
	return (
		<div className="px-4 py-3.5">
			<p className="font-semibold text-[12px] text-gray-900">Sponsored</p>
			<div className="mt-1.5 flex items-center gap-2">
				<BrandMark
					brandName={ad.brandName}
					className="size-7"
					logoUrl={logoUrl}
				/>
				<span className="min-w-0 leading-tight">
					<span className="block truncate text-[13px] text-gray-900">
						{ad.brandName}
					</span>
					<span className="block truncate text-[11px] text-gray-600">
						https://www.{domain}
					</span>
				</span>
			</div>
			<p className="wrap-break-word mt-1.5 text-[#1a0dab] text-lg leading-snug">
				{ad.headline} | {ad.brandName}
			</p>
			<p className="wrap-break-word mt-0.5 line-clamp-2 text-[13px] text-gray-700 leading-normal">
				{ad.primaryText} {ad.cta} today.
			</p>
		</div>
	);
}

const PLACEMENT_COMPONENTS: Record<
	AdPlacement,
	(props: PlacementProps) => ReturnType<typeof InstagramAd>
> = {
	instagram: InstagramAd,
	facebook: FacebookAd,
	linkedin: LinkedInAd,
	x: XAd,
	tiktok: TikTokAd,
	google: GoogleAd,
};
