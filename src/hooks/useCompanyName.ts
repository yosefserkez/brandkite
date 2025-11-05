import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type UseCompanyNameResult = {
	name: string | undefined;
	isLoading: boolean;
	updateName: (newName: string) => Promise<void>;
};

/**
 * Hook to easily access and update the company name
 * @param companyId - The ID of the company
 * @returns Object with name, isLoading state, and updateName function
 */
export function useCompanyName(
	companyId: Id<"companies">
): UseCompanyNameResult {
	const company = useQuery(api.companies.get, { companyId });
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

	return {
		name: company?.name,
		isLoading: company === undefined,
		updateName,
	};
}
