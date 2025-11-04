import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type ModuleCardProps = {
	children: ReactNode;
	title?: string;
	icon?: string;
	className?: string;
};

/**
 * Simple card container with optional icon + title header.
 * Use with BlockWrapper for a complete module layout.
 *
 * @example
 * ```tsx
 * const ctx = useBrandModule(companyId, "colors");
 *
 * <BlockWrapper actions={<ModuleActions ctx={ctx} />} ctx={ctx}>
 *   <ModuleCard title="Colors" icon="🎨">
 *     <YourContent />
 *   </ModuleCard>
 * </BlockWrapper>
 * ```
 */
export function ModuleCard({
	children,
	title,
	icon,
	className,
}: ModuleCardProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-md border border-gray-200/70 bg-white transition-colors group-hover:border-gray-300",
				className
			)}
		>
			{(title || icon) && (
				<div className="flex w-full items-start justify-between px-5 py-4 text-left">
					<div className="flex items-start gap-3">
						{icon && (
							<span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-xl">
								{icon}
							</span>
						)}
						{title && (
							<div className="space-y-1">
								<h3 className="font-semibold text-gray-900 text-xl">{title}</h3>
							</div>
						)}
					</div>
				</div>
			)}

			<div className={cn("px-5 pb-5", title || icon ? "pt-0" : "pt-5")}>
				{children}
			</div>
		</div>
	);
}
