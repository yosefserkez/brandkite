import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ColorsModule from "./modules/ColorsModule";
import LogoModule from "./modules/LogoModule";
import NamesModule from "./modules/NamesModule";
import ValuesModule from "./modules/ValuesModule";
import VisionModule from "./modules/VisionModule";

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
			{/* Notion-like page header */}
			<div className="mx-auto max-w-5xl px-8 pt-16 pb-8">
				<div className="mb-2 text-gray-500 text-sm">
					Brand Studio / {company.name}
				</div>
				<h1 className="mb-1 font-bold text-5xl text-gray-900">
					Brand Identity
				</h1>
				<p className="text-gray-600 text-lg">{company.description}</p>
			</div>

			{/* Module blocks */}
			<div className="mx-auto max-w-5xl space-y-8 px-8 pb-16">
				{/* Names & Logo block - combined as header image with logo overlay */}
				<div className="relative">
					<NamesModule className="mb-18 h-48" companyId={companyId} />
					<LogoModule
						className="absolute top-64 left-6"
						companyId={companyId}
					/>
				</div>
				{/* Vision block */}
				<VisionModule companyId={companyId} />

				{/* Values block */}
				<ValuesModule companyId={companyId} />

				{/* Colors block */}
				<ColorsModule companyId={companyId} />
			</div>
		</div>
	);
}
