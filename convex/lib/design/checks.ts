import { BANNED_BUZZWORDS } from "./skills";

// Deterministic quality checks. Cheap, run before (or instead of) any LLM
// judge; violations feed one corrective retry in generateChecked().
export type CheckViolation = string;

// ── Copy checks ────────────────────────────────────────────────────────────

const collectStrings = (value: unknown, out: string[]): string[] => {
	if (typeof value === "string") {
		out.push(value);
	} else if (Array.isArray(value)) {
		for (const item of value) {
			collectStrings(item, out);
		}
	} else if (value && typeof value === "object") {
		for (const item of Object.values(value)) {
			collectStrings(item, out);
		}
	}
	return out;
};

export const allText = (value: unknown): string =>
	collectStrings(value, []).join("\n");

export const findBuzzwords = (text: string): CheckViolation[] => {
	const lower = text.toLowerCase();
	return BANNED_BUZZWORDS.filter((word) =>
		new RegExp(`\\b${word}\\b`, "i").test(lower)
	).map((word) => `Banned buzzword used: "${word}" — rephrase concretely.`);
};

const EM_DASH_PATTERN = /—/g;

// Statistic-shaped claims (counts, percentages, ratings, "#1") that do not
// appear in the source brand context are treated as fabricated.
const STAT_PATTERNS = [
	/\b\d{1,3}(?:,\d{3})+\+?\b/g,
	/\b\d+(?:\.\d+)?%/g,
	/\b\d+(?:\.\d+)?[kKmM]\+/g,
	/\b\d+\+\s*(?:users|customers|teams|companies|brands|founders)/gi,
	/#1\b/g,
	/\b\d(?:\.\d)?\/5\b/g,
];

export const findFabricatedStats = (
	text: string,
	sourceContext: string
): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	for (const pattern of STAT_PATTERNS) {
		for (const match of text.matchAll(pattern)) {
			if (!sourceContext.includes(match[0])) {
				violations.push(
					`Statistic "${match[0]}" does not appear in the brand context — remove it and make the point qualitatively.`
				);
			}
		}
	}
	return violations;
};

// Cadence patterns that read as machine-written (Impeccable "slop" tells).
const EM_DASH_LIMIT = 1;
const APHORISM_PATTERN =
	/\bnot (?:just )?(?:a|an|your) [^.!?]{2,40}\.\s+(?:a|an|it's) [^.!?]{2,40}\./i;

export const findCadenceTells = (text: string): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	const emDashes = (text.match(EM_DASH_PATTERN) ?? []).length;
	if (emDashes > EM_DASH_LIMIT) {
		violations.push(
			`${emDashes} em-dashes — an AI cadence tell. Use at most one; restructure the other sentences.`
		);
	}
	if (APHORISM_PATTERN.test(text)) {
		violations.push(
			'The "Not a X. A Y." aphorism pattern is an AI cadence tell — make the point directly.'
		);
	}
	return violations;
};

export const copyChecks = (
	value: unknown,
	sourceContext: string
): CheckViolation[] => {
	const text = allText(value);
	return [
		...findBuzzwords(text),
		...findFabricatedStats(text, sourceContext),
		...findCadenceTells(text),
	];
};

// ── Color checks ───────────────────────────────────────────────────────────

const HEX_CHANNELS_PATTERN = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX_RADIX = 16;

const hexToRgb = (hex: string): [number, number, number] | null => {
	const match = hex.trim().match(HEX_CHANNELS_PATTERN);
	if (!match) {
		return null;
	}
	return [
		Number.parseInt(match[1], HEX_RADIX),
		Number.parseInt(match[2], HEX_RADIX),
		Number.parseInt(match[3], HEX_RADIX),
	];
};

// WCAG 2.x relative-luminance constants (sRGB linearization + luma weights).
const RGB_MAX = 255;
const SRGB_LINEAR_THRESHOLD = 0.039_28;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_DIVISOR = 1.055;
const SRGB_GAMMA_EXPONENT = 2.4;
const LUMA_WEIGHT_R = 0.2126;
const LUMA_WEIGHT_G = 0.7152;
const LUMA_WEIGHT_B = 0.0722;
const CONTRAST_OFFSET = 0.05;

const channelLuminance = (channel: number): number => {
	const c = channel / RGB_MAX;
	return c <= SRGB_LINEAR_THRESHOLD
		? c / SRGB_LINEAR_DIVISOR
		: ((c + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR) ** SRGB_GAMMA_EXPONENT;
};

const relativeLuminance = (rgb: [number, number, number]): number =>
	LUMA_WEIGHT_R * channelLuminance(rgb[0]) +
	LUMA_WEIGHT_G * channelLuminance(rgb[1]) +
	LUMA_WEIGHT_B * channelLuminance(rgb[2]);

export const contrastRatio = (hexA: string, hexB: string): number => {
	const a = hexToRgb(hexA);
	const b = hexToRgb(hexB);
	if (!(a && b)) {
		return 0;
	}
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
	return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
};

const rgbDistance = (hexA: string, hexB: string): number => {
	const a = hexToRgb(hexA);
	const b = hexToRgb(hexB);
	if (!(a && b)) {
		return Number.POSITIVE_INFINITY;
	}
	return Math.sqrt(
		(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
	);
};

const TEXT_CONTRAST_MINIMUM = 4.5;
const SIMILARITY_THRESHOLD = 60;

export const paletteChecks = (hexes: string[]): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	const readable = hexes.some(
		(hex) => contrastRatio(hex, "#FFFFFF") >= TEXT_CONTRAST_MINIMUM
	);
	if (hexes.length > 0 && !readable) {
		violations.push(
			"No palette color is readable as text on white (needs WCAG contrast >= 4.5:1). Deepen the anchor color."
		);
	}
	for (const [i, hexA] of hexes.entries()) {
		for (const hexB of hexes.slice(i + 1)) {
			if (rgbDistance(hexA, hexB) < SIMILARITY_THRESHOLD) {
				violations.push(
					`Colors ${hexA} and ${hexB} are nearly identical — make each color earn a distinct role.`
				);
			}
		}
	}
	return violations;
};

// ── Typography checks ──────────────────────────────────────────────────────

const DEFAULT_DISPLAY_FONTS = [
	"inter",
	"roboto",
	"open sans",
	"lato",
	"arial",
	"helvetica",
	"helvetica neue",
	"space grotesk",
	"plus jakarta sans",
	"geist",
	"fraunces",
];

export const typographyChecks = (fonts: {
	primaryFontName: string;
	headlineFontName: string;
}): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	const headline = fonts.headlineFontName.trim().toLowerCase();
	if (DEFAULT_DISPLAY_FONTS.includes(headline)) {
		violations.push(
			`"${fonts.headlineFontName}" is a default, not a decision — choose a display face with a point of view.`
		);
	}
	if (
		headline === fonts.primaryFontName.trim().toLowerCase() &&
		headline.length > 0
	) {
		violations.push(
			"Headline and primary font are identical — the pairing must have deliberate contrast."
		);
	}
	return violations;
};

// ── SVG checks (logo) ──────────────────────────────────────────────────────

const SVG_VIEWBOX_PATTERN = /viewBox="0 0 100 100"/;
const SVG_FORBIDDEN_PATTERN = /<(linearGradient|radialGradient|filter|text)\b/i;
const SVG_SHAPE_PATTERN =
	/<(circle|rect|path|polygon|line|ellipse|polyline)\b/i;

export const svgChecks = (svg: string): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	if (!SVG_VIEWBOX_PATTERN.test(svg)) {
		violations.push('SVG must use viewBox="0 0 100 100".');
	}
	if (SVG_FORBIDDEN_PATTERN.test(svg)) {
		violations.push("SVG must not contain gradients, filters, or <text>.");
	}
	if (!SVG_SHAPE_PATTERN.test(svg)) {
		violations.push("SVG contains no drawable shapes.");
	}
	return violations;
};
