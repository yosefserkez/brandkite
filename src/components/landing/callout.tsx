import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CalloutProps = {
	children: ReactNode;
	show: boolean;
	side: "left" | "right";
	className?: string;
};

/**
 * A subtle annotation label pointing at a piece of the assembled brand kit.
 * Hidden on small screens; only decorates the desktop layout.
 */
export function Callout({ children, show, side, className }: CalloutProps) {
	const connector = <span className="h-px w-7 shrink-0 bg-gray-300" />;
	const hiddenOffset =
		side === "left" ? "-translate-x-2 opacity-0" : "translate-x-2 opacity-0";

	return (
		<div
			className={cn(
				"pointer-events-none absolute hidden items-center gap-2 transition-all duration-500 ease-out lg:flex",
				show ? "translate-x-0 opacity-100" : hiddenOffset,
				className
			)}
		>
			{side === "right" ? connector : null}
			<span className="whitespace-nowrap rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 font-medium text-[11px] text-gray-500 shadow-sm backdrop-blur">
				{children}
			</span>
			{side === "left" ? connector : null}
		</div>
	);
}
