import { useCompanyName } from "@/hooks/useCompanyName";
import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandStory } from "../../../convex/modules/story";
import { useBrandModule } from "../../hooks/useBrandModule";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Ripple } from "../ui/ripple";
import { BlockWrapper } from "./BlockWrapper";

type StoryModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

const loadingSkeleton = (
	<div className="h-full w-full items-center justify-center rounded-lg border-4 border-white bg-white shadow-lg">
		<Ripple className="h-full w-full" mainCircleSize={40} numCircles={2} />
	</div>
);

export default function StoryModule({
	companyId,
	className,
}: StoryModuleProps) {
	const ctx = useBrandModule(companyId, "story");
	const { name: companyName } = useCompanyName(companyId);
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
			loadingSkeleton={loadingSkeleton}
		>
			{/* Logo container with profile photo styling */}
			<Card className="min-h-96">
				<CardHeader className="m-0">
					<div>
						<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
							Brand story
						</p>
						<h2 className="font-semibold text-2xl text-gray-900">
							How we got here
						</h2>
					</div>
				</CardHeader>
				<CardContent>
					{data?.story ? (
						<p className="text-lg">
							{replaceCompanyName(data.story, companyName)}
						</p>
					) : (
						loadingSkeleton
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
