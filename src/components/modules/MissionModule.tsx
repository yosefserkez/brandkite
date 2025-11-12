import { useCompanyName } from "@/hooks/useCompanyName";
import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandMission } from "../../../convex/modules/mission";
import { useBrandModule } from "../../hooks/useBrandModule";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Ripple } from "../ui/ripple";
import { BlockWrapper } from "./BlockWrapper";

type MissionModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

const loadingSkeleton = (
	<div className="h-full w-full items-center justify-center rounded-lg border-4 border-white bg-white shadow-lg">
		<Ripple className="h-full w-full" mainCircleSize={40} numCircles={2} />
	</div>
);

export default function MissionModule({
	companyId,
	className,
}: MissionModuleProps) {
	const ctx = useBrandModule(companyId, "mission");
	const { name: companyName } = useCompanyName(companyId);
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
			className={className}
			ctx={ctx}
			loadingSkeleton={loadingSkeleton}
		>
			<Card className="min-h-48">
				<CardHeader className="m-0">
					<div>
						<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
							Mission
						</p>
						<h2 className="font-semibold text-2xl text-gray-900">
							Why we exist
						</h2>
					</div>
				</CardHeader>
				<CardContent>
					{data?.mission ? (
						<p className="text-lg leading-relaxed">
							{replaceCompanyName(data.mission, companyName)}
						</p>
					) : (
						loadingSkeleton
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}

