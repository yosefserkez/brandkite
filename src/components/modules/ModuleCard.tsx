import type { BrandModuleType } from "@convex/workflows";
import type { ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";

type ModuleCardProps = {
	companyId: Id<"companies">;
	moduleType: BrandModuleType;
	title: string;
	icon: string;
	children: (ctx: ReturnType<typeof useBrandModule>) => ReactNode;
};

export function ModuleCard({
	companyId,
	moduleType,
	title,
	icon,
	children,
}: ModuleCardProps) {
	const ctx = useBrandModule(companyId, moduleType);

	return (
		<div className="group rounded-md border border-gray-200/70 bg-white transition-colors hover:border-gray-300">
			<div className="flex w-full items-start justify-between px-5 py-4 text-left">
				<div className="flex items-start gap-3">
					<span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-xl">
						{icon}
					</span>
					<div className="space-y-1">
						<h3 className="font-semibold text-gray-900 text-xl">{title}</h3>
					</div>
				</div>
			</div>

			<div className="px-5 pt-0 pb-3">
				<div className="mb-3 flex items-center gap-2">
					<select
						className="rounded-md border border-gray-200 px-2 py-1 text-sm"
						onChange={(e) =>
							ctx.setSelectedId(e.target.value as Id<"brandModules">)
						}
						value={(ctx.selectedId as string) ?? ""}
					>
						{(ctx.versions ?? []).map((m) => (
							<option key={m._id} value={m._id as string}>
								v{m.computedVersion ?? "?"}
								{/* {m.generationStatus && m.generationStatus !== "idle"
									? ` · ${m.generationStatus}`
									: ""} */}
							</option>
						))}
					</select>
					<button
						className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
						disabled={!ctx.selected || ctx.isPublishing}
						onClick={ctx.publishSelected}
						type="button"
					>
						Publish
					</button>
					<button
						className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
						disabled={ctx.isRegenerating}
						onClick={() => ctx.regenerate(false)}
						type="button"
					>
						{ctx.isRegenerating ? "..." : "Regenerate"}
					</button>
				</div>

				{ctx.selected &&
				(ctx.selected.generationStatus === "queued" ||
					ctx.selected.generationStatus === "in_progress") ? (
					<div className="animate-pulse space-y-2">
						<div className="h-4 w-1/3 rounded bg-gray-200" />
						<div className="h-3 w-full rounded bg-gray-200" />
						<div className="h-3 w-5/6 rounded bg-gray-200" />
						<div className="h-3 w-2/3 rounded bg-gray-200" />
					</div>
				) : (
					children(ctx)
				)}
			</div>
		</div>
	);
}
