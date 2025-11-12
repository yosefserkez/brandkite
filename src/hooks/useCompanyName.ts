import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
	useCompanyBrandLogoUrl,
	useCompanyBrandName,
	useCompanyBrandReady,
} from "./useCompanyBrand";

type UseCompanyNameResult = {
	name: string | undefined;
	logoUrl: string | undefined;
	loading: boolean;
	updateName: (newName: string) => Promise<void>;
};

/**
 * Hook to easily access and update the company name
 * @param companyId - The ID of the company
 * @returns Object with name, loading state, and updateName function
 */
export function useCompanyName(
	companyId: Id<"companies">
): UseCompanyNameResult {
	const storeName = useCompanyBrandName(companyId);
	const storeLogo = useCompanyBrandLogoUrl(companyId);
	const storeReady = useCompanyBrandReady(companyId);

	const shouldFetch =
		!storeReady || storeName === undefined || storeLogo === undefined;

	const company = useQuery(
		api.companies.get,
		shouldFetch ? { companyId } : "skip"
	);
	const updateCompanyMutation = useMutation(api.companies.update);

	const updateName = useCallback(
		async (newName: string) => {
			await updateCompanyMutation({
				companyId,
				name: newName,
			});
		},
		[companyId, updateCompanyMutation]
	);

	const name =
		storeReady && storeName !== undefined ? storeName : company?.name;
	const logoUrl =
		storeReady && storeLogo !== undefined ? storeLogo : company?.logoUrl;

	return {
		name,
		logoUrl,
		loading: shouldFetch ? company === undefined : false,
		updateName,
	};
}
