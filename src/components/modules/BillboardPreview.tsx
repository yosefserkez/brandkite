import { cn } from "../../lib/utils";
import Logo from "../logo";
import { HyperText } from "../ui/hyper-text";

type BillboardPreviewProps = {
	name: string;
	className?: string;
	containerHeight?: string;
	logo?: string;
};

export function BillboardPreview({
	name,
	className,
	containerHeight = "240px",
	logo,
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
					{/* todo: long names will break the layout on mobile */}
					<div className="flex items-center justify-center gap-2 text-center">
						{logo && (
							<div className="h-10 w-10 opacity-95">
								<Logo url={logo} />
							</div>
						)}
						<HyperText animateOnHover={false}>{name}</HyperText>
						<span className="mt-2 self-start text-black/50 text-xs">
							&trade;
						</span>
					</div>
				</h1>
			</div>
		</div>
	);
}
