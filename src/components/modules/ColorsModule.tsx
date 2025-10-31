import { useEffect, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { UseBrandModuleResult } from "../../hooks/useBrandModule";
import { ModuleCard } from "./ModuleCard";

interface ColorsModuleProps {
	companyId: Id<"companies">;
}

type ColorEntry = { name: string; hex: string };
interface ColorsData {
	primary: ColorEntry;
	secondary: ColorEntry;
	accent?: ColorEntry;
	additional?: ColorEntry[];
}

export default function ColorsModule({ companyId }: ColorsModuleProps) {
	return (
		<ModuleCard
			companyId={companyId}
			moduleType="colors"
			title="Colors"
			icon="🎨"
		>
			{(ctx) => <ColorsModuleBody ctx={ctx} />}
		</ModuleCard>
	);
}

function ColorsModuleBody({ ctx }: { ctx: UseBrandModuleResult }) {
	const [draft, setDraft] = useState<ColorsData | null>(null);

	useEffect(() => {
		if (ctx.selected) {
			setDraft((ctx.selected.data as ColorsData) ?? null);
		}
	}, [ctx.selected]);

	const updateColor = (path: string[], value: string) => {
		if (!draft) return;
		const next: any = { ...draft };
		let ref = next;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			ref[key] = { ...(ref[key] ?? {}) };
			ref = ref[key];
		}
		ref[path[path.length - 1]] = value;
		setDraft(next);
	};

	return (
		<div className="space-y-4">
			{draft ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{(["primary", "secondary", "accent"] as const).map((k) => (
						<div key={k} className="space-y-2">
							<div className="text-sm font-medium text-gray-700">{k}</div>
							<div className="flex items-center gap-2">
								<input
									className="px-3 py-2 text-sm rounded-md border border-gray-300 w-40"
									placeholder="Name"
									value={(draft as any)?.[k]?.name ?? ""}
									onChange={(e) => updateColor([k, "name"], e.target.value)}
								/>
								<input
									className="px-3 py-2 text-sm rounded-md border border-gray-300 w-40"
									placeholder="#000000"
									value={(draft as any)?.[k]?.hex ?? ""}
									onChange={(e) => updateColor([k, "hex"], e.target.value)}
								/>
								<div
									className="h-8 w-8 rounded border"
									style={{ backgroundColor: (draft as any)?.[k]?.hex }}
								/>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="text-gray-500 italic">
					AI is generating this module...
				</div>
			)}

			<div>
				<button
					type="button"
					onClick={() => ctx.saveSelected(draft)}
					className="px-3 py-1.5 text-sm rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-60"
					disabled={!ctx.selected || ctx.isSaving}
				>
					{ctx.isSaving ? "Saving..." : "Save"}
				</button>
			</div>
		</div>
	);
}
