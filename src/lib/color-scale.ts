const HEX_PREFIX = "#";
const HEX_LENGTH = 6;
const HEX_PREFIX_LENGTH = 1;
const HEX_BYTE_LENGTH = 2;
const HEX_PAD_CHAR = "0";
const HEX_RADIX = 16;

const ONE = 1;
const TWO = 2;
const THREE = 3;
const FOUR = 4;
const SIX = 6;
const HALF = 0.5;
const ONE_THIRD = ONE / THREE;
const ONE_SIXTH = ONE / SIX;
const TWO_THIRDS = TWO / THREE;
const HUE_SEGMENT_COUNT = SIX;
const RGB_COMPONENT_MAX = 255;
const HEX_GREEN_OFFSET = HEX_BYTE_LENGTH;
const HEX_BLUE_OFFSET = HEX_BYTE_LENGTH * TWO;
const HUE_OFFSET_SECOND_QUADRANT = TWO;
const HUE_OFFSET_THIRD_QUADRANT = FOUR;

const SHADE_STOP_DARKEST = 950;
const SHADE_STOP_DEEPER = 900;
const SHADE_STOP_DARK = 800;
const SHADE_STOP_SEMI_DARK = 700;
const SHADE_STOP_MID_DARK = 600;
const SHADE_STOP_BASE = 500;
const SHADE_STOP_MID_LIGHT = 400;
const SHADE_STOP_SEMI_LIGHT = 300;
const SHADE_STOP_LIGHT = 200;
const SHADE_STOP_LIGHTER = 100;
const SHADE_STOP_LIGHTEST = 50;

export const BRAND_SHADE_STOPS = [
	SHADE_STOP_DARKEST,
	SHADE_STOP_DEEPER,
	SHADE_STOP_DARK,
	SHADE_STOP_SEMI_DARK,
	SHADE_STOP_MID_DARK,
	SHADE_STOP_BASE,
	SHADE_STOP_MID_LIGHT,
	SHADE_STOP_SEMI_LIGHT,
	SHADE_STOP_LIGHT,
	SHADE_STOP_LIGHTER,
	SHADE_STOP_LIGHTEST,
] as const;

export const BRAND_SHADE_BASE_STOP = SHADE_STOP_BASE;

export type BrandShadeStop = (typeof BRAND_SHADE_STOPS)[number];

export type BrandColorScaleEntry = {
	stop: BrandShadeStop;
	hex: string;
};

const LIGHTNESS_DELTA_DARKEST = -0.35;
const LIGHTNESS_DELTA_DEEPER = -0.28;
const LIGHTNESS_DELTA_DARK = -0.22;
const LIGHTNESS_DELTA_SEMI_DARK = -0.16;
const LIGHTNESS_DELTA_MID_DARK = -0.08;
const LIGHTNESS_DELTA_BASE = 0;
const LIGHTNESS_DELTA_MID_LIGHT = 0.08;
const LIGHTNESS_DELTA_SEMI_LIGHT = 0.16;
const LIGHTNESS_DELTA_LIGHT = 0.24;
const LIGHTNESS_DELTA_LIGHTER = 0.32;
const LIGHTNESS_DELTA_LIGHTEST = 0.4;

const LIGHTNESS_DELTAS: Record<BrandShadeStop, number> = {
	[SHADE_STOP_DARKEST]: LIGHTNESS_DELTA_DARKEST,
	[SHADE_STOP_DEEPER]: LIGHTNESS_DELTA_DEEPER,
	[SHADE_STOP_DARK]: LIGHTNESS_DELTA_DARK,
	[SHADE_STOP_SEMI_DARK]: LIGHTNESS_DELTA_SEMI_DARK,
	[SHADE_STOP_MID_DARK]: LIGHTNESS_DELTA_MID_DARK,
	[SHADE_STOP_BASE]: LIGHTNESS_DELTA_BASE,
	[SHADE_STOP_MID_LIGHT]: LIGHTNESS_DELTA_MID_LIGHT,
	[SHADE_STOP_SEMI_LIGHT]: LIGHTNESS_DELTA_SEMI_LIGHT,
	[SHADE_STOP_LIGHT]: LIGHTNESS_DELTA_LIGHT,
	[SHADE_STOP_LIGHTER]: LIGHTNESS_DELTA_LIGHTER,
	[SHADE_STOP_LIGHTEST]: LIGHTNESS_DELTA_LIGHTEST,
};

export function generateColorScale(hex: string): BrandColorScaleEntry[] {
	const normalized = normalizeHex(hex);
	return BRAND_SHADE_STOPS.map((stop) => ({
		stop,
		hex: adjustLightness(normalized, LIGHTNESS_DELTAS[stop]),
	}));
}

function normalizeHex(value: string): string {
	const trimmed = value.trim();
	const withoutPrefix = trimmed.startsWith(HEX_PREFIX)
		? trimmed.slice(HEX_PREFIX_LENGTH)
		: trimmed;
	const compact = withoutPrefix
		.slice(0, HEX_LENGTH)
		.padEnd(HEX_LENGTH, HEX_PAD_CHAR);
	return `${HEX_PREFIX}${compact.toUpperCase()}`;
}

function adjustLightness(hex: string, delta: number): string {
	const { r, g, b } = hexToRgb(hex);
	const { h, s, l } = rgbToHsl(r, g, b);
	const next = clamp(l + delta, 0, 1);
	const { r: nr, g: ng, b: nb } = hslToRgb(h, s, next);
	return rgbToHex(nr, ng, nb);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const normalized = normalizeHex(hex).slice(HEX_PREFIX_LENGTH);
	return {
		r: Number.parseInt(normalized.slice(0, HEX_BYTE_LENGTH), HEX_RADIX),
		g: Number.parseInt(
			normalized.slice(HEX_GREEN_OFFSET, HEX_BLUE_OFFSET),
			HEX_RADIX
		),
		b: Number.parseInt(
			normalized.slice(HEX_BLUE_OFFSET, HEX_BLUE_OFFSET + HEX_BYTE_LENGTH),
			HEX_RADIX
		),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (value: number) =>
		Math.round(value)
			.toString(HEX_RADIX)
			.padStart(HEX_BYTE_LENGTH, HEX_PAD_CHAR)
			.toUpperCase();
	return `${HEX_PREFIX}${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(
	r: number,
	g: number,
	b: number
): { h: number; s: number; l: number } {
	const rn = r / RGB_COMPONENT_MAX;
	const gn = g / RGB_COMPONENT_MAX;
	const bn = b / RGB_COMPONENT_MAX;

	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const delta = max - min;

	let h = 0;
	let s = 0;
	const l = (max + min) / TWO;

	if (delta !== 0) {
		s = l > HALF ? delta / (TWO - max - min) : delta / (max + min);

		switch (max) {
			case rn:
				h = (gn - bn) / delta + (gn < bn ? HUE_SEGMENT_COUNT : 0);
				break;
			case gn:
				h = (bn - rn) / delta + HUE_OFFSET_SECOND_QUADRANT;
				break;
			default:
				h = (rn - gn) / delta + HUE_OFFSET_THIRD_QUADRANT;
				break;
		}

		h /= HUE_SEGMENT_COUNT;
	}

	return { h, s, l };
}

function hslToRgb(
	h: number,
	s: number,
	l: number
): { r: number; g: number; b: number } {
	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < HALF ? l * (ONE + s) : l + s - l * s;
		const p = TWO * l - q;
		r = hueToRgb(p, q, h + ONE_THIRD);
		g = hueToRgb(p, q, h);
		b = hueToRgb(p, q, h - ONE_THIRD);
	}

	return {
		r: Math.round(r * RGB_COMPONENT_MAX),
		g: Math.round(g * RGB_COMPONENT_MAX),
		b: Math.round(b * RGB_COMPONENT_MAX),
	};
}

function hueToRgb(p: number, q: number, t: number): number {
	let temp = t;
	if (temp < 0) {
		temp += ONE;
	}
	if (temp > ONE) {
		temp -= ONE;
	}
	if (temp < ONE_SIXTH) {
		return p + (q - p) * HUE_SEGMENT_COUNT * temp;
	}
	if (temp < HALF) {
		return q;
	}
	if (temp < TWO_THIRDS) {
		return p + (q - p) * (TWO_THIRDS - temp) * HUE_SEGMENT_COUNT;
	}
	return p;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
