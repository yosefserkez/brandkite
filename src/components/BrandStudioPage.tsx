import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useCompanyBrand } from "../hooks/useCompanyBrand";
import { Feedback } from "./feedback";
import ColorsModule from "./modules/ColorsModule";
import LogoModule from "./modules/LogoModule";
import MissionModule from "./modules/MissionModule";
import NamesModule from "./modules/NamesModule";
import StoryModule from "./modules/StoryModule";
import TaglineModule from "./modules/TaglineModule";
import ToneModule from "./modules/ToneModule";
import TypographyModule from "./modules/TypographyModule";
import { FlickeringGrid } from "./ui/flickering-grid";

type BrandStudioPageProps = {
	companyId: Id<"companies">;
};

export function BrandStudioPage({ companyId }: BrandStudioPageProps) {
	const { company, loading } = useCompanyBrand(companyId);
	const updatePresence = useMutation(api.presence.updatePresence);

	useEffect(() => {
		void updatePresence({ companyId });
	}, [companyId, updatePresence]);

	if (loading || !company) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-full w-full">
					<FlickeringGrid />
				</div>
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto bg-white">
			{/* Module blocks */}
			<div className="mx-auto max-w-5xl space-y-10 overflow-hidden px-4 py-4">
				{/* Names & Logo block - combined as header image with logo overlay */}
				<NamesModule companyId={companyId} />
				<div className="flex flex-col gap-10 md:grid md:grid-cols-4 md:grid-rows-1 md:gap-4 md:pb-6">
					<div className="col-span-1 flex flex-col gap-10 md:gap-4">
						<LogoModule className="h-full w-full" companyId={companyId} />
						<div className="hidden h-full w-full rounded-t-lg bg-linear-to-b from-brand-primary-50 to-gray-50 md:block" />
					</div>
					<div className="col-span-3 flex flex-col gap-10 md:gap-4">
						<MissionModule companyId={companyId} />
						<TaglineModule companyId={companyId} />
					</div>
				</div>
				<StoryModule companyId={companyId} />
				<ColorsModule companyId={companyId} />
				<ToneModule companyId={companyId} />
				<TypographyModule companyId={companyId} />
				<Feedback />
			</div>
		</div>
	);
}
