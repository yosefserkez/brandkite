import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandStory } from "../../../convex/modules/story";
import { useBrandModule } from "../../hooks/useBrandModule";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

	const data = ctx.selected?.data as BrandStory | undefined;

	const onCopy = () => {
		if (data?.story) {
			navigator.clipboard.writeText(data.story);
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
			<Card>
				<CardHeader>
					<CardTitle>Brand Story</CardTitle>
				</CardHeader>
				<CardContent>
					{data?.story ? (
						<p className="text-lg">{data.story}</p>
					) : (
						loadingSkeleton
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
