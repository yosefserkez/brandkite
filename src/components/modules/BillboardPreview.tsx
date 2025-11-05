import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type BillboardPreviewProps = {
	name: string;
	className?: string;
	containerHeight?: string;
};

const MAX_FONT_SIZE = 48;
const MIN_FONT_SIZE = 16;
const CONTAINER_WIDTH_RATIO = 0.6;
const TRADEMARK_SIZE_RATIO = 0.25;

export function BillboardPreview({
	name,
	className,
	containerHeight = "240px",
}: BillboardPreviewProps) {
	const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);
	const textRef = useRef<HTMLSpanElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Adjust font size to fit container
	useEffect(() => {
		const adjustFontSize = () => {
			if (!textRef.current || !containerRef.current) {
				return;
			}

			const containerWidth = containerRef.current.offsetWidth;
			const maxWidth = containerWidth * CONTAINER_WIDTH_RATIO;
			let currentSize = MAX_FONT_SIZE;

			// Create a temporary span to measure text width
			const measureSpan = document.createElement("span");
			measureSpan.style.visibility = "hidden";
			measureSpan.style.position = "absolute";
			measureSpan.style.whiteSpace = "nowrap";
			measureSpan.style.fontWeight = "bold";
			measureSpan.textContent = name;
			document.body.appendChild(measureSpan);

			// Decrease font size until it fits
			while (currentSize > MIN_FONT_SIZE) {
				measureSpan.style.fontSize = `${currentSize}px`;
				if (measureSpan.offsetWidth <= maxWidth) {
					break;
				}
				currentSize -= 2;
			}

			document.body.removeChild(measureSpan);
			setFontSize(currentSize);
		};

		adjustFontSize();
		window.addEventListener("resize", adjustFontSize);
		return () => window.removeEventListener("resize", adjustFontSize);
	}, [name]);

	return (
		<div
			className={cn("relative w-full", className)}
			ref={containerRef}
			style={{
				backgroundImage: "url('/billboard.png')",
				backgroundSize: "cover",
				backgroundPosition: "center",
				minHeight: containerHeight,
			}}
		>
			{/* Name overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center px-4">
				<h1 className="font-bold text-black/50">
					<div className="flex items-start gap-1">
						<span
							className="font-bold text-black/50"
							ref={textRef}
							style={{ fontSize: `${fontSize}px` }}
						>
							{name}
						</span>
						<span
							className="select-none text-black/40"
							style={{ fontSize: `${fontSize * TRADEMARK_SIZE_RATIO}px` }}
						>
							&trade;
						</span>
					</div>
				</h1>
			</div>
		</div>
	);
}

