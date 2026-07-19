import { SkeletonFlickeringGrid } from "./skeleton-flickering-grid";
import { Card, CardContent, CardHeader } from "./ui/card";

export function SuspenseCard({
	headerText,
	contentHeight = 400,
	contentWidth = 1000,
}: {
	headerText: string;
	contentHeight?: number;
	contentWidth?: number;
}) {
	return (
		<Card className="h-full overflow-hidden">
			<CardHeader className="space-y-4">
				<div className="space-y-2">
					<p className="wrap-break-word col-span-full place-self-stretch font-medium text-[11px] text-gray-400 uppercase tracking-[0.08em]">
						{headerText}
					</p>
				</div>
			</CardHeader>
			<CardContent className="mt-2 space-y-4">
				<SkeletonFlickeringGrid height={contentHeight} width={contentWidth} />
			</CardContent>
		</Card>
	);
}
