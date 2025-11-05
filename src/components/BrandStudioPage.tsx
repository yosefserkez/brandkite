import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import NamesModule from "./modules/NamesModule";

type BrandStudioPageProps = {
	companyId: Id<"companies">;
};

export function BrandStudioPage({ companyId }: BrandStudioPageProps) {
	const company = useQuery(api.companies.get, { companyId });

	if (!company) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto bg-gray-50">
			{/* Module blocks */}
			<div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
				{/* Names & Logo block - combined as header image with logo overlay */}
				<NamesModule companyId={companyId} />
				{/* <LogoModule companyId={companyId} /> */}
			</div>
		</div>
	);
}
