import { useEffect, useRef, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";
import { cn } from "../../lib/utils";
import { BlockWrapper } from "./BlockWrapper";

type NamesModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

type NameData = {
	name: { name: string; reasoning: string };
	domains: string[];
}[];

const MAX_FONT_SIZE = 60; // text-6xl equivalent
const MIN_FONT_SIZE = 20; // Minimum readable size
const CONTAINER_WIDTH_RATIO = 0.5; // Use 90% of container width
const TRADEMARK_SIZE_RATIO = 0.25; // Trademark relative to name size

export default function NamesModule({
	companyId,
	className,
}: NamesModuleProps) {
	const ctx = useBrandModule(companyId, "name");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);
	const textRef = useRef<HTMLSpanElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const data = ctx.selected?.data as NameData | undefined;
	const selectedName = data?.[selectedIndex]?.name?.name ?? "Brand Name";

	useEffect(() => {
		if (data && data.length > 0) {
			setSelectedIndex(0);
		}
	}, [data]);

	// Adjust font size to fit container
	useEffect(() => {
		const adjustFontSize = () => {
			if (!textRef.current) {
				return;
			}
			if (!containerRef.current) {
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
			measureSpan.textContent = selectedName;
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
	}, [selectedName]);

	return (
		<BlockWrapper className="overflow-hidden rounded-lg" ctx={ctx}>
			<div className="bg-white">
				{/* Header background with gradient */}
				<div
					className={cn("relative w-full", className)}
					ref={containerRef}
					style={{
						backgroundImage: "url('/billboard.png')",
						backgroundSize: "cover",
						backgroundPosition: "center",
						minHeight: "320px",
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
									{selectedName}
								</span>
								<span
									className="select-none text-black/40"
									style={{ fontSize: `${fontSize * TRADEMARK_SIZE_RATIO}px` }}
								>
									&trade;
								</span>
							</div>
						</h1>
						{data && data.length > 0 && (
							<div className="mt-4 flex gap-2">
								{data.map((item, idx) => (
									<button
										className={`h-2 w-2 rounded-full transition-all ${
											idx === selectedIndex
												? "w-8 bg-white"
												: "bg-white/50 hover:bg-white/75"
										}`}
										key={`name-${item.name.name}-${idx}`}
										onClick={() => setSelectedIndex(idx)}
										type="button"
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Name details */}
				{data?.[selectedIndex] && (
					<div className="space-y-4 bg-white p-6">
						<div>
							<h3 className="mb-2 font-semibold text-gray-900">Reasoning</h3>
							<p className="text-gray-700 text-sm leading-relaxed">
								{data[selectedIndex].name.reasoning}
							</p>
						</div>

						{data[selectedIndex].domains.length > 0 && (
							<div>
								<h3 className="mb-2 font-semibold text-gray-900">
									Available Domains
								</h3>
								<div className="flex flex-wrap gap-2">
									{data[selectedIndex].domains.map((domain) => (
										<span
											className="rounded-full bg-green-50 px-3 py-1 font-mono text-green-700 text-xs"
											key={domain}
										>
											{domain}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</BlockWrapper>
	);
}
