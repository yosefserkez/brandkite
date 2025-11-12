import { useCompanyName } from "@/hooks/useCompanyName";
import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTagline } from "../../../convex/modules/tagline";
import { useBrandModule } from "../../hooks/useBrandModule";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Ripple } from "../ui/ripple";
import { BlockWrapper } from "./BlockWrapper";

type TaglineModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

const loadingSkeleton = (
	<div className="flex h-48 items-center justify-center rounded-lg border border-gray-100 bg-white">
		<Ripple className="h-full w-full" mainCircleSize={32} numCircles={2} />
	</div>
);

export default function TaglineModule({
	companyId,
	className,
}: TaglineModuleProps) {
	const ctx = useBrandModule(companyId, "tagline");
	const { name: companyName } = useCompanyName(companyId);
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
			className={className}
			ctx={ctx}
			loadingSkeleton={loadingSkeleton}
		>
			<Card className="min-h-48 overflow-hidden border border-gray-100 shadow-sm">
				<CardHeader className="pb-2">
					<div>
						<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
							Brand tagline
						</p>
						<h2 className="font-semibold text-2xl text-gray-900">
							The promise in a line
						</h2>
					</div>
				</CardHeader>
				<CardContent className="pt-4">
					{data?.tagline ? (
						<p className="font-semibold text-3xl text-gray-900 leading-tight">
							{replaceCompanyName(data.tagline, companyName)}
						</p>
					) : (
						loadingSkeleton
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}

