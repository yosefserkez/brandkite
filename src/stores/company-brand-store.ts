import { Store } from "@tanstack/store";
import type { BrandPalette } from "../../convex/modules/colors";
import type { BrandTypography } from "../../convex/modules/typography";
import { BRAND_SHADE_STOPS, generateColorScale } from "../lib/color-scale";

type BrandColorRole = "primary" | "secondary" | "accent";

type ColorScale = Record<string, string>;

export type CompanyBrandState = {
	companyId: string | null;
	name: string | null;
	logoUrl: string | null;
	tagline: string | null;
	typography: BrandTypography | null;
	colors: BrandPalette | null;
	colorScales: Partial<Record<BrandColorRole, ColorScale>>;
	ready: boolean;
};

const DEFAULT_STATE: CompanyBrandState = {
	companyId: null,
	name: null,
	logoUrl: null,
	tagline: null,
	typography: null,
	colors: null,
	colorScales: {},
	ready: false,
};

export const companyBrandStore = new Store<CompanyBrandState>(DEFAULT_STATE);

const COLOR_ROLES: readonly BrandColorRole[] = [
	"primary",
	"secondary",
	"accent",
] as const;

const WHITESPACE_REGEX = /\s/;

const DEFAULT_COLOR_FALLBACKS: Record<string, string> =
	BRAND_SHADE_STOPS.reduce(
		(acc, stop) => {
			const key = String(stop);
			acc[`primary-${key}`] = "#111827";
			acc[`secondary-${key}`] = "#1F2937";
			acc[`accent-${key}`] = "#0EA5E9";
			return acc;
		},
		{} as Record<string, string>
	);

const DEFAULT_FONT_STACK =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export function resetCompanyBrandState(): void {
	companyBrandStore.setState(DEFAULT_STATE);
	clearBrandCssTokens();
}

export function setCompanyIdentity(params: {
	companyId: string;
	name: string | null | undefined;
	logoUrl: string | null | undefined;
	tagline?: string | null;
}): void {
	const nextState = {
		...companyBrandStore.state,
		companyId: params.companyId,
		name: params.name ?? null,
		logoUrl: params.logoUrl ?? null,
		tagline: params.tagline ?? null,
	};
	companyBrandStore.setState(nextState);
}

export function setCompanyTypography(typography: BrandTypography | null): void {
	companyBrandStore.setState({
		...companyBrandStore.state,
		typography,
	});
	applyTypographyTokens(typography);
	markReadyIfComplete();
}

export function setCompanyPalette(palette: BrandPalette | null): void {
	const colorScales: Partial<Record<BrandColorRole, ColorScale>> = {};

	if (palette) {
		for (const [index, color] of palette.colors.entries()) {
			const role = COLOR_ROLES[index];
			if (!role) {
				continue;
			}
			colorScales[role] = generateColorScale(color.hex).reduce((acc, shade) => {
				acc[String(shade.stop)] = shade.hex;
				return acc;
			}, {} as ColorScale);
		}
	}

	companyBrandStore.setState({
		...companyBrandStore.state,
		colors: palette,
		colorScales,
	});

	applyColorTokens(colorScales);
	markReadyIfComplete();
}

export function markBrandDataLoading(): void {
	companyBrandStore.setState({
		...companyBrandStore.state,
		ready: false,
	});
}

function markReadyIfComplete(): void {
	const { ready, colors, typography, companyId } = companyBrandStore.state;
	if (ready) {
		return;
	}
	if (companyId && (colors || typography)) {
		companyBrandStore.setState({
			...companyBrandStore.state,
			ready: true,
		});
	}
}

function applyColorTokens(
	colorScales: Partial<Record<BrandColorRole, ColorScale>>
): void {
	if (typeof document === "undefined") {
		return;
	}
	const root = document.documentElement;

	for (const role of COLOR_ROLES) {
		const scale = colorScales[role];
		for (const stop of BRAND_SHADE_STOPS) {
			const stopKey = String(stop);
			const key = `${role}-${stopKey}`;
			const value =
				scale?.[stopKey] ??
				DEFAULT_COLOR_FALLBACKS[key] ??
				DEFAULT_COLOR_FALLBACKS[`primary-${stopKey}`];
			root.style.setProperty(`--brand-${role}-${stop}`, value);
		}

		if (scale?.["500"]) {
			root.style.setProperty(`--brand-${role}`, scale["500"]);
		} else {
			root.style.setProperty(
				`--brand-${role}`,
				DEFAULT_COLOR_FALLBACKS[`${role}-500`] ??
					DEFAULT_COLOR_FALLBACKS["primary-500"]
			);
		}
	}
}

function applyTypographyTokens(typography: BrandTypography | null): void {
	if (typeof document === "undefined") {
		return;
	}
	const root = document.documentElement;

	if (!typography) {
		root.style.removeProperty("--font-brand-primary");
		root.style.removeProperty("--font-brand-headline");
		root.style.removeProperty("--font-brand-body");
		return;
	}

	const primaryStack = buildFontStack(typography.primaryFont?.name ?? "");
	const headlineStack = buildFontStack(typography.headlineFont?.name ?? "");

	root.style.setProperty("--font-brand-primary", primaryStack);
	root.style.setProperty("--font-brand-headline", headlineStack);
	root.style.setProperty("--font-brand-body", primaryStack);
}

function clearBrandCssTokens(): void {
	if (typeof document === "undefined") {
		return;
	}
	const root = document.documentElement;
	for (const role of COLOR_ROLES) {
		for (const stop of BRAND_SHADE_STOPS) {
			root.style.removeProperty(`--brand-${role}-${stop}`);
		}
		root.style.removeProperty(`--brand-${role}`);
	}
	root.style.removeProperty("--font-brand-primary");
	root.style.removeProperty("--font-brand-headline");
	root.style.removeProperty("--font-brand-body");
}

function buildFontStack(fontName: string): string {
	const trimmed = fontName.trim();
	if (!trimmed) {
		return DEFAULT_FONT_STACK;
	}
	const requiresQuotes = WHITESPACE_REGEX.test(trimmed);
	const formatted = requiresQuotes ? `'${trimmed}'` : trimmed;
	return `${formatted}, ${DEFAULT_FONT_STACK}`;
}
