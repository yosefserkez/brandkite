import type { ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";

interface ModuleCardProps {
	companyId: Id<"companies">;
	moduleType: string;
	title: string;
	icon: string;
	children: (ctx: ReturnType<typeof useBrandModule>) => ReactNode;
}

export function ModuleCard({
	companyId,
	moduleType,
	title,
	icon,
	children,
}: ModuleCardProps) {
	const ctx = useBrandModule(companyId, moduleType);

	return (
		<div className="group bg-white rounded-md border border-gray-200/70 hover:border-gray-300 transition-colors">
			<div className="w-full px-5 py-4 flex items-start justify-between text-left">
				<div className="flex items-start gap-3">
					<span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-xl">
						{icon}
					</span>
					<div className="space-y-1">
						<h3 className="text-xl font-semibold text-gray-900">{title}</h3>
					</div>
				</div>
			</div>

			<div className="px-5 pb-3 pt-0">
				<div className="flex items-center gap-2 mb-3">
					<select
						className="px-2 py-1 text-sm border border-gray-200 rounded-md"
						value={(ctx.selectedId as string) ?? ""}
						onChange={(e) =>
							ctx.setSelectedId(e.target.value as Id<"brandModules">)
						}
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
						type="button"
						onClick={ctx.publishSelected}
						className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
						disabled={!ctx.selected || ctx.isPublishing}
					>
						Publish
					</button>
					<button
						type="button"
						onClick={() => ctx.regenerate(false)}
						className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
						disabled={ctx.isRegenerating}
					>
						{ctx.isRegenerating ? "..." : "Regenerate"}
					</button>
				</div>

				{ctx.selected &&
				(ctx.selected.generationStatus === "queued" ||
					ctx.selected.generationStatus === "in_progress") ? (
					<div className="space-y-2 animate-pulse">
						<div className="h-4 bg-gray-200 rounded w-1/3" />
						<div className="h-3 bg-gray-200 rounded w-full" />
						<div className="h-3 bg-gray-200 rounded w-5/6" />
						<div className="h-3 bg-gray-200 rounded w-2/3" />
					</div>
				) : (
					children(ctx)
				)}
			</div>
		</div>
	);
}
