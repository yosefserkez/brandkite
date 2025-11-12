import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTagline } from "../../../convex/modules/tagline";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { SkeletonFlickeringGrid } from "../skeleton-flickering-grid";
import { Card, CardContent, CardHeader } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type TaglineModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function TaglineModule({
	companyId,
	className,
}: TaglineModuleProps) {
	const ctx = useBrandModule(companyId, "tagline");
	const companyName = useCompanyBrandName(companyId);
	const data = ctx.selected?.data as BrandTagline | undefined;

	const onCopy = () => {
		if (data?.tagline) {
			navigator.clipboard.writeText(
				replaceCompanyName(data.tagline, companyName)
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
			<Card className="overflow-hidden">
				<CardHeader>
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Tagline
					</p>
				</CardHeader>
				<CardContent className="">
					{data?.tagline ? (
						<p className="font-semibold text-3xl text-gray-900 leading-tight">
							{replaceCompanyName(data.tagline, companyName)}
						</p>
					) : (
						<SkeletonFlickeringGrid />
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
