import { useStore } from "@tanstack/react-store";
import { useConvex, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { BrandPalette } from "../../convex/modules/colors";
import type { BrandTypography } from "../../convex/modules/typography";
import {
	companyBrandStore,
	markBrandDataLoading,
	resetCompanyBrandState,
	setCompanyIdentity,
	setCompanyPalette,
	setCompanyTypography,
} from "../stores/company-brand-store";
import type { BrandModuleVersionDoc } from "./useBrandModule";

type ModuleData =
	| BrandPalette
	| BrandTypography
	| Record<string, unknown>
	| null;

function getLatestPublishedModuleData(
	modules: BrandModuleVersionDoc[]
): ModuleData {
	if (modules.length === 0) {
		return null;
	}
	const published = modules.find((module) => module.published);
	const selectedModule = published ?? modules[0];
	return selectedModule?.data as ModuleData;
}

type CompanyWithAssets =
	| (Doc<"companies"> & {
			logoUrl?: string | null;
			tagline?: string | null;
	  })
	| null;

export type UseCompanyBrandResult = {
	company: CompanyWithAssets;
	loading: boolean;
};

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const CLOUDFLARE_SIGNED_URL_TTL_MINUTES = 15;
const CLOUDFLARE_SIGNED_URL_TTL_SECONDS =
	CLOUDFLARE_SIGNED_URL_TTL_MINUTES * SECONDS_PER_MINUTE;
const CLOUDFLARE_SIGNED_URL_TTL_MS =
	CLOUDFLARE_SIGNED_URL_TTL_SECONDS * MS_PER_SECOND;
const LOGO_URL_REFRESH_BUFFER_MS = 5000;
const LOGO_URL_REFRESH_RETRY_MS = 30_000;
const MIN_LOGO_REFRESH_DELAY_MS = 1000;
const LOGO_URL_REFRESH_DELAY_MS = Math.max(
	CLOUDFLARE_SIGNED_URL_TTL_MS - LOGO_URL_REFRESH_BUFFER_MS,
	MIN_LOGO_REFRESH_DELAY_MS
);

export function useCompanyBrand(
	companyId: Id<"companies">
): UseCompanyBrandResult {
	const convex = useConvex();
	const currentCompanyIdRef = useRef<string | null>(null);
	const logoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const isMountedRef = useRef(true);
	const [companyOverride, setCompanyOverride] =
		useState<CompanyWithAssets | null>(null);
	const [hasCompanyOverride, setHasCompanyOverride] = useState(false);

	const clearLogoRefreshTimeout = useCallback(() => {
		if (logoRefreshTimeoutRef.current !== null) {
			clearTimeout(logoRefreshTimeoutRef.current);
			logoRefreshTimeoutRef.current = null;
		}
	}, []);

	useEffect(
		() => () => {
			isMountedRef.current = false;
			clearLogoRefreshTimeout();
		},
		[clearLogoRefreshTimeout]
	);

	useEffect(() => {
		if (currentCompanyIdRef.current !== companyId) {
			currentCompanyIdRef.current = companyId;
			setHasCompanyOverride(false);
			resetCompanyBrandState();
			markBrandDataLoading();
		}
	}, [companyId]);

	const company = useQuery(api.companies.get, { companyId });
	const typographyModules = useQuery(api.brandModules.getModulesByType, {
		companyId,
		type: "typography",
	}) as BrandModuleVersionDoc[] | undefined;
	const colorModules = useQuery(api.brandModules.getModulesByType, {
		companyId,
		type: "colors",
	}) as BrandModuleVersionDoc[] | undefined;

	useEffect(() => {
		if (company !== undefined) {
			setHasCompanyOverride(false);
		}
	}, [company]);

	const effectiveCompany: CompanyWithAssets | null | undefined = (() => {
		if (hasCompanyOverride) {
			return companyOverride;
		}
		if (company === undefined) {
			return;
		}
		return company ?? null;
	})();

	const fetchLatestCompany = useCallback(async () => {
		try {
			const result = await convex.query(api.companies.get, { companyId });
			if (!isMountedRef.current || currentCompanyIdRef.current !== companyId) {
				return false;
			}
			setCompanyOverride(result ?? null);
			setHasCompanyOverride(true);
			return true;
		} catch {
			return false;
		}
	}, [companyId, convex]);

	const enqueueLogoRefresh = useCallback(
		(delayMs: number) => {
			clearLogoRefreshTimeout();
			logoRefreshTimeoutRef.current = setTimeout(() => {
				logoRefreshTimeoutRef.current = null;
				fetchLatestCompany().then((success) => {
					if (!isMountedRef.current) {
						return;
					}
					if (!success) {
						enqueueLogoRefresh(LOGO_URL_REFRESH_RETRY_MS);
					}
				});
			}, delayMs);
		},
		[clearLogoRefreshTimeout, fetchLatestCompany]
	);

	useEffect(() => {
		if (effectiveCompany === undefined) {
			return;
		}
		if (!effectiveCompany) {
			resetCompanyBrandState();
			return;
		}
		setCompanyIdentity({
			companyId: effectiveCompany._id as unknown as string,
			name: effectiveCompany.name,
			logoUrl: effectiveCompany.logoUrl,
			tagline:
				(effectiveCompany as { tagline?: string | null })?.tagline ?? null,
		});
	}, [effectiveCompany]);

	useEffect(() => {
		if (!effectiveCompany?.logoUrl) {
			return;
		}
		enqueueLogoRefresh(LOGO_URL_REFRESH_DELAY_MS);

		return () => {
			clearLogoRefreshTimeout();
		};
	}, [clearLogoRefreshTimeout, effectiveCompany, enqueueLogoRefresh]);

	useEffect(() => {
		if (colorModules === undefined) {
			return;
		}
		const paletteData = getLatestPublishedModuleData(colorModules);
		setCompanyPalette((paletteData ?? null) as BrandPalette | null);
	}, [colorModules]);

	useEffect(() => {
		if (typographyModules === undefined) {
			return;
		}
		const typographyData = getLatestPublishedModuleData(typographyModules);
		setCompanyTypography((typographyData ?? null) as BrandTypography | null);
	}, [typographyModules]);

	return {
		company: (effectiveCompany ?? null) as CompanyWithAssets,
		loading: company === undefined,
	};
}

export function useCompanyBrandState() {
	return useStore(companyBrandStore);
}

export function useCompanyBrandSelector<T>(
	selector: (state: typeof companyBrandStore.state) => T
): T {
	return useStore(companyBrandStore, selector);
}

export function useCompanyBrandName(
	companyId: Id<"companies">
): string | undefined {
	return useCompanyBrandSelector((state) =>
		state.companyId === companyId ? (state.name ?? undefined) : undefined
	);
}

export function useCompanyBrandLogoUrl(
	companyId: Id<"companies">
): string | undefined {
	return useCompanyBrandSelector((state) =>
		state.companyId === companyId ? (state.logoUrl ?? undefined) : undefined
	);
}

export function useCompanyBrandReady(companyId: Id<"companies">): boolean {
	return useCompanyBrandSelector(
		(state) => state.companyId === companyId && state.ready
	);
}
