import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandStory } from "../../../convex/modules/story";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { SkeletonFlickeringGrid } from "../skeleton-flickering-grid";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type StoryModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function StoryModule({
	companyId,
	className,
}: StoryModuleProps) {
	const ctx = useBrandModule(companyId, "story");
	const companyName = useCompanyBrandName(companyId);
	const data = ctx.selected?.data as BrandStory | undefined;

	const onCopy = () => {
		if (data?.story) {
			navigator.clipboard.writeText(
				replaceCompanyName(data.story, companyName)
			);
		}
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Story" />}
		>
			{/* Logo container with profile photo styling */}
			<Card className="h-full">
				<CardHeader>
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Story
					</p>
				</CardHeader>
				<CardContent>
					{data?.story ? (
						<p className="text-lg">
							{replaceCompanyName(data.story, companyName)}
						</p>
					) : (
						<SkeletonFlickeringGrid />
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
