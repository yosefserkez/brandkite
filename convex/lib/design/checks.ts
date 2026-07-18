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
	const emDashes = (text.match(/—/g) ?? []).length;
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

const hexToRgb = (hex: string): [number, number, number] | null => {
	const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
	if (!match) {
		return null;
	}
	const value = Number.parseInt(match[1], 16);
	// biome-ignore lint/nursery/noBitwiseOperators: standard hex unpack
	return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
};

const channelLuminance = (channel: number): number => {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (rgb: [number, number, number]): number =>
	0.2126 * channelLuminance(rgb[0]) +
	0.7152 * channelLuminance(rgb[1]) +
	0.0722 * channelLuminance(rgb[2]);

export const contrastRatio = (hexA: string, hexB: string): number => {
	const a = hexToRgb(hexA);
	const b = hexToRgb(hexB);
	if (!a || !b) {
		return 0;
	}
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
	return (lighter + 0.05) / (darker + 0.05);
};

const rgbDistance = (hexA: string, hexB: string): number => {
	const a = hexToRgb(hexA);
	const b = hexToRgb(hexB);
	if (!a || !b) {
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
	for (let i = 0; i < hexes.length; i++) {
		for (let j = i + 1; j < hexes.length; j++) {
			if (rgbDistance(hexes[i], hexes[j]) < SIMILARITY_THRESHOLD) {
				violations.push(
					`Colors ${hexes[i]} and ${hexes[j]} are nearly identical — make each color earn a distinct role.`
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

export const svgChecks = (svg: string): CheckViolation[] => {
	const violations: CheckViolation[] = [];
	if (!/viewBox="0 0 100 100"/.test(svg)) {
		violations.push('SVG must use viewBox="0 0 100 100".');
	}
	if (/<(linearGradient|radialGradient|filter|text)\b/i.test(svg)) {
		violations.push("SVG must not contain gradients, filters, or <text>.");
	}
	if (!/<(circle|rect|path|polygon|line|ellipse|polyline)\b/i.test(svg)) {
		violations.push("SVG contains no drawable shapes.");
	}
	return violations;
};
