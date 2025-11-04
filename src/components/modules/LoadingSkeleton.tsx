type LoadingSkeletonProps = {
	lines?: number;
	className?: string;
};

export function LoadingSkeleton({
	lines = 4,
	className,
}: LoadingSkeletonProps) {
	const widths = ["w-1/3", "w-full", "w-5/6", "w-2/3"];

	return (
		<div className={`animate-pulse space-y-2 ${className ?? ""}`}>
			{Array.from({ length: lines }).map((_, i) => {
				const widthClass = widths[i % widths.length];
				const heightClass = `h-${i === 0 ? "4" : "3"}`;
				// Using a stable key by combining string "skeleton-line" and width/height
				const key = `skeleton-line-${i}-${widthClass}-${heightClass}`;
				return (
					<div
						className={`${heightClass} ${widthClass} rounded bg-gray-200`}
						key={key}
					/>
				);
			})}
		</div>
	);
}
