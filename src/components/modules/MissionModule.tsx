import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandMission } from "../../../convex/modules/mission";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { SkeletonFlickeringGrid } from "../skeleton-flickering-grid";
import { Card, CardContent, CardHeader } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type MissionModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function MissionModule({
	companyId,
	className,
}: MissionModuleProps) {
	const ctx = useBrandModule(companyId, "mission");
	const companyName = useCompanyBrandName(companyId);
	const data = ctx.selected?.data as BrandMission | undefined;

	const onCopy = () => {
		if (data?.mission) {
			navigator.clipboard.writeText(
				replaceCompanyName(data.mission, companyName)
			);
		}
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			actionsVariant="compact"
			className={className}
			ctx={ctx}
			loadingSkeleton={<SkeletonFlickeringGrid />}
		>
			<Card className="">
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Mission
					</p>
				</CardHeader>
				<CardContent>
					{data?.mission ? (
						<p className="wrap-break-word font-semibold text-gray-950 text-xl tracking-tight md:text-xl lg:text-2xl">
							{replaceCompanyName(data.mission, companyName)}
						</p>
					) : (
						<SkeletonFlickeringGrid />
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
