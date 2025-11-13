import type { Id } from "../../convex/_generated/dataModel";
import { useCompanyBrand } from "../hooks/useCompanyBrand";
import ColorsModule from "./modules/ColorsModule";
import LogoModule from "./modules/LogoModule";
import MissionModule from "./modules/MissionModule";
import NamesModule from "./modules/NamesModule";
import StoryModule from "./modules/StoryModule";
import TaglineModule from "./modules/TaglineModule";
import ToneModule from "./modules/ToneModule";
import TypographyModule from "./modules/TypographyModule";

type BrandStudioPageProps = {
	companyId: Id<"companies">;
};

export function BrandStudioPage({ companyId }: BrandStudioPageProps) {
	const { company, loading } = useCompanyBrand(companyId);

	if (loading || !company) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto bg-gray-50">
			{/* Module blocks */}
			<div className="mx-auto max-w-5xl space-y-4 px-8 py-8">
				{/* Names & Logo block - combined as header image with logo overlay */}
				<NamesModule companyId={companyId} />
				<div className="grid grid-cols-1 gap-4 pb-8 md:grid-cols-3">
					<div className="col-span-1 flex flex-col gap-4">
						<LogoModule className="h-full w-full" companyId={companyId} />
						<div className="h-full w-full rounded-t-lg bg-linear-to-b from-brand-accent-200 to-gray-50" />
					</div>
					<div className="col-span-2 flex flex-col gap-4">
						<MissionModule companyId={companyId} />
						<TaglineModule companyId={companyId} />
					</div>
				</div>
				<StoryModule companyId={companyId} />
				<ColorsModule companyId={companyId} />
				<ToneModule companyId={companyId} />
				<TypographyModule companyId={companyId} />
			</div>
		</div>
	);
}
