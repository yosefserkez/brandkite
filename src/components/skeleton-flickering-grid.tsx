import { cn } from "@/lib/utils";
import { FlickeringGrid } from "./ui/flickering-grid";

export const SkeletonFlickeringGrid = ({
	className,
	height = 100,
	width = 1000,
}: {
	className?: string;
	height?: number;
	width?: number;
}) => (
	<div className="h-full w-full items-center justify-center">
		<FlickeringGrid
			className={cn(
				"color-brand-primary mask-[radial-gradient(450px_circle_at_center,white,transparent)] relative inset-0 z-0",
				className
			)}
			flickerChance={0.1}
			gridGap={6}
			height={height}
			maxOpacity={0.5}
			squareSize={4}
			width={width}
		/>
	</div>
);
