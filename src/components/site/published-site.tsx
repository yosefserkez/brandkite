import { useEffect, useMemo } from "react";

// ── Types (mirror api.site.getSiteBySlug payload) ──────────────────────────
type SiteColor = { hex: string; name: string; role: string };

export type PublishedSiteData = {
	name: string;
	tagline: string;
	logoUrl: string | null;
	colors: SiteColor[];
	fonts: { headline: string | null; body: string | null };
	website: {
		hero: { headline: string; subheadline: string };
		features: { title: string; description: string }[];
		cta: { headline: string; buttonText: string };
	} | null;
};

// ── Dynamic Google Font loading (pattern from TypographyModule) ────────────
const WHITESPACE_PATTERN = /\s/;
const LOADED_GOOGLE_FONT_URLS = new Set<string>();
const FONT_WEIGHT_REGULAR = 400;
const FONT_WEIGHT_MEDIUM = 500;
const FONT_WEIGHT_SEMIBOLD = 600;
const FONT_WEIGHT_BOLD = 700;
const SITE_FONT_WEIGHTS = [
	FONT_WEIGHT_REGULAR,
	FONT_WEIGHT_MEDIUM,
	FONT_WEIGHT_SEMIBOLD,
	FONT_WEIGHT_BOLD,
];

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

function loadGoogleFontFamily(
	fontName: string | null | undefined,
	weights: number[]
) {
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

function buildFontStack(fontName: string | null | undefined): string {
	const trimmed = (fontName ?? "").trim();
	if (!trimmed) {
		return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
	}
	const normalized = WHITESPACE_PATTERN.test(trimmed)
		? `"${trimmed}"`
		: trimmed;
	return `${normalized}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

// ── Color helpers ──────────────────────────────────────────────────────────
const HEX_SHORT = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_FULL = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const HEX_RADIX = 16;
const INK = "#111827"; // gray-900 fallback ink
const WHITE = "#ffffff";

// sRGB relative-luminance constants (WCAG).
const SRGB_MAX = 255;
const SRGB_LINEAR_THRESHOLD = 0.039_28;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA_EXP = 2.4;
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;
const LIGHT_SURFACE_LUMINANCE = 0.45;

// Alpha levels used for brand-tinted washes and borders.
const ALPHA_HAIRLINE = 0.14;
const ALPHA_OUTLINE = 0.28;
const ALPHA_WASH = 0.1;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	if (!hex) {
		return null;
	}
	const short = hex.match(HEX_SHORT);
	if (short) {
		return {
			r: Number.parseInt(short[1] + short[1], HEX_RADIX),
			g: Number.parseInt(short[2] + short[2], HEX_RADIX),
			b: Number.parseInt(short[3] + short[3], HEX_RADIX),
		};
	}
	const full = hex.match(HEX_FULL);
	if (full) {
		return {
			r: Number.parseInt(full[1], HEX_RADIX),
			g: Number.parseInt(full[2], HEX_RADIX),
			b: Number.parseInt(full[3], HEX_RADIX),
		};
	}
	return null;
}

function rgba(hex: string, alpha: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) {
		const fallback = hexToRgb(INK);
		return `rgba(${fallback?.r ?? 0}, ${fallback?.g ?? 0}, ${fallback?.b ?? 0}, ${alpha})`;
	}
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Relative luminance → pick readable text color on a colored surface.
function readableTextOn(hex: string): string {
	const rgb = hexToRgb(hex);
	if (!rgb) {
		return WHITE;
	}
	const toLinear = (c: number) => {
		const s = c / SRGB_MAX;
		return s <= SRGB_LINEAR_THRESHOLD
			? s / SRGB_LINEAR_DIVISOR
			: ((s + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA_EXP;
	};
	const luminance =
		LUMA_R * toLinear(rgb.r) +
		LUMA_G * toLinear(rgb.g) +
		LUMA_B * toLinear(rgb.b);
	return luminance > LIGHT_SURFACE_LUMINANCE ? INK : WHITE;
}

// ── Component ───────────────────────────────────────────────────────────────
export function PublishedSite({ data }: { data: PublishedSiteData }) {
	const headlineFont = data.fonts.headline;
	const bodyFont = data.fonts.body;

	useEffect(() => {
		loadGoogleFontFamily(headlineFont, SITE_FONT_WEIGHTS);
		loadGoogleFontFamily(bodyFont, SITE_FONT_WEIGHTS);
	}, [headlineFont, bodyFont]);

	const headlineStack = useMemo(
		() => buildFontStack(headlineFont),
		[headlineFont]
	);
	const bodyStack = useMemo(() => buildFontStack(bodyFont), [bodyFont]);

	const primary = data.colors[0]?.hex ?? "#111827";
	const neutral = data.colors[1]?.hex ?? "#64748b";
	const accent = data.colors[2]?.hex ?? primary;
	const onPrimary = readableTextOn(primary);

	const { website } = data;

	const primaryButtonStyle: React.CSSProperties = {
		backgroundColor: primary,
		color: onPrimary,
		fontFamily: bodyStack,
	};

	const heroCtaLabel = website?.cta.buttonText ?? "Get started";

	return (
		<div
			className="min-h-screen bg-white text-gray-900"
			style={{ fontFamily: bodyStack }}
		>
			{/* Nav */}
			<header
				className="sticky top-0 z-30 border-gray-100 border-b bg-white/80 backdrop-blur-md"
				style={{ borderColor: rgba(neutral, ALPHA_HAIRLINE) }}
			>
				<nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
					<a
						className="flex items-center gap-2.5"
						href="#top"
						style={{ fontFamily: headlineStack }}
					>
						{data.logoUrl ? (
							<span className="flex h-8 w-8 items-center justify-center">
								<img
									alt={`${data.name} logo`}
									className="h-full w-full max-w-full object-contain"
									height="32"
									src={data.logoUrl}
									width="32"
								/>
							</span>
						) : (
							<span
								className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm"
								style={{ backgroundColor: primary, color: onPrimary }}
							>
								{data.name.charAt(0).toUpperCase()}
							</span>
						)}
						<span className="font-bold text-gray-900 text-lg tracking-tight">
							{data.name}
						</span>
					</a>
					<a
						className="hover:-translate-y-px inline-flex items-center rounded-full px-4 py-2 font-medium text-sm shadow-sm transition-transform"
						href="#cta"
						style={primaryButtonStyle}
					>
						{heroCtaLabel}
					</a>
				</nav>
			</header>

			<main id="top">
				{/* Hero */}
				<section className="relative overflow-hidden">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0"
						style={{
							background: `radial-gradient(60% 60% at 50% 0%, ${rgba(accent, ALPHA_WASH)} 0%, rgba(255,255,255,0) 70%)`,
						}}
					/>
					<div className="relative mx-auto max-w-4xl px-5 pt-20 pb-16 text-center sm:px-8 sm:pt-28 sm:pb-24">
						{data.tagline ? (
							<p
								className="mb-6 flex items-center justify-center gap-2 font-medium text-sm"
								style={{ color: accent, fontFamily: bodyStack }}
							>
								<span
									aria-hidden="true"
									className="h-px w-6"
									style={{ backgroundColor: accent }}
								/>
								{data.tagline}
							</p>
						) : null}
						<h1
							className="text-balance font-bold text-4xl text-gray-950 leading-[1.05] tracking-tight sm:text-6xl"
							style={{ fontFamily: headlineStack }}
						>
							{website?.hero.headline ?? data.name}
						</h1>
						<p
							className="mx-auto mt-6 max-w-2xl text-balance text-gray-600 text-lg leading-relaxed sm:text-xl"
							style={{ fontFamily: bodyStack }}
						>
							{website?.hero.subheadline ?? data.tagline}
						</p>
						<div className="mt-9 flex flex-wrap items-center justify-center gap-3">
							<a
								className="hover:-translate-y-px inline-flex items-center rounded-full px-6 py-3 font-semibold text-base shadow-md transition-transform"
								href="#cta"
								style={primaryButtonStyle}
							>
								{heroCtaLabel}
							</a>
							<a
								className="inline-flex items-center rounded-full border px-6 py-3 font-semibold text-base text-gray-700 transition-colors hover:bg-gray-50"
								href="#features"
								style={{ borderColor: rgba(neutral, ALPHA_OUTLINE) }}
							>
								Learn more
							</a>
						</div>
					</div>
				</section>

				{/* Features */}
				{website && website.features.length > 0 ? (
					<section
						className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
						id="features"
					>
						<div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
							{website.features.map((feature) => (
								<article className="pt-5" key={feature.title}>
									<span
										aria-hidden="true"
										className="mb-5 block h-0.5 w-8"
										style={{ backgroundColor: accent }}
									/>
									<h3
										className="font-semibold text-gray-950 text-xl tracking-tight"
										style={{ fontFamily: headlineStack }}
									>
										{feature.title}
									</h3>
									<p className="mt-2.5 text-gray-600 leading-relaxed">
										{feature.description}
									</p>
								</article>
							))}
						</div>
					</section>
				) : null}

				{/* Closing CTA band */}
				<section className="px-5 pb-20 sm:px-8" id="cta">
					<div
						className="mx-auto max-w-6xl rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20"
						style={{ backgroundColor: primary, color: onPrimary }}
					>
						<div>
							<h2
								className="mx-auto max-w-2xl text-balance font-bold text-3xl leading-tight tracking-tight sm:text-4xl"
								style={{ fontFamily: headlineStack }}
							>
								{website?.cta.headline ?? `Get started with ${data.name}`}
							</h2>
							<div className="mt-8">
								<a
									className="hover:-translate-y-px inline-flex items-center rounded-full bg-white px-7 py-3 font-semibold text-base text-gray-950 shadow-lg transition-transform"
									href="#top"
								>
									{heroCtaLabel}
								</a>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer
				className="border-gray-100 border-t"
				style={{ borderColor: rgba(neutral, ALPHA_HAIRLINE) }}
			>
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
					<div className="flex items-center gap-2.5">
						{data.logoUrl ? (
							<span className="flex h-6 w-6 items-center justify-center">
								<img
									alt={`${data.name} logo`}
									className="h-full w-full max-w-full object-contain"
									height="24"
									src={data.logoUrl}
									width="24"
								/>
							</span>
						) : null}
						<span
							className="font-semibold text-gray-900 text-sm"
							style={{ fontFamily: headlineStack }}
						>
							{data.name}
						</span>
					</div>
					<a
						className="text-gray-400 text-xs transition-colors hover:text-gray-600"
						href="https://brandkite.co"
						rel="noopener noreferrer"
						target="_blank"
					>
						Made with Brandkite
					</a>
				</div>
			</footer>
		</div>
	);
}
