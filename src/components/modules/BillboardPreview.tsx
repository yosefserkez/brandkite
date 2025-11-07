import { cn } from "../../lib/utils";
import { HyperText } from "../ui/hyper-text";

type BillboardPreviewProps = {
	name: string;
	className?: string;
	containerHeight?: string;
};

export function BillboardPreview({
	name,
	className,
	containerHeight = "240px",
}: BillboardPreviewProps) {
	return (
		<div
			className={cn("relative w-full", className)}
			style={{
				backgroundImage: "url('/billboard.png')",
				backgroundSize: "cover",
				backgroundPosition: "center",
				minHeight: containerHeight,
			}}
		>
			{/* Name overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center px-4">
				<h1 className="font-bold text-black/80">
					<div className="flex items-center justify-center text-center">
						<HyperText animateOnHover={false}>{name}</HyperText>
					</div>
				</h1>
			</div>
		</div>
	);
}
