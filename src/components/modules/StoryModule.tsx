import { replaceCompanyName } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandStory } from "../../../convex/modules/story";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
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
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Story
					</p>
				</CardHeader>
				<CardContent>
					<p className="wrap-break-word text-justify text-gray-950 text-xl tracking-tight">
						{replaceCompanyName(data?.story ?? "", companyName)}
					</p>
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
