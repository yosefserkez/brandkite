import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTagline } from "../../../convex/modules/tagline";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { SuspenseCard } from "../suspense-card";
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
			loadingSkeleton={
				<SuspenseCard contentHeight={100} headerText="Tagline" />
			}
		>
			<Card className="overflow-hidden">
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Tagline
					</p>
				</CardHeader>
				<CardContent className="">
					<p className="wrap-break-word text-gray-950 text-xl tracking-tight md:text-xl lg:text-2xl">
						{replaceCompanyName(data?.tagline ?? "", companyName)}
					</p>
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
