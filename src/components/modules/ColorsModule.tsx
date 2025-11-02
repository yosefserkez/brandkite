import { useEffect, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type UseBrandModuleResult from "../../hooks/useBrandModule";
import { ModuleCard } from "./ModuleCard";

type ColorsModuleProps = {
	companyId: Id<"companies">;
};

type ColorEntry = { name: string; hex: string };
type ColorsData = {
	primary: ColorEntry;
	secondary: ColorEntry;
	accent?: ColorEntry;
	additional?: ColorEntry[];
};

export default function ColorsModule({ companyId }: ColorsModuleProps) {
	return (
		<ModuleCard
			companyId={companyId}
			icon="🎨"
			moduleType="colors"
			title="Colors"
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
		if (!draft) {
			return;
		}
		const next: any = { ...draft };
		let ref = next;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			ref[key] = { ...(ref[key] ?? {}) };
			ref = ref[key];
		}
		ref[path.at(-1)] = value;
		setDraft(next);
	};

	return (
		<div className="space-y-4">
			{draft ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{(["primary", "secondary", "accent"] as const).map((k) => (
						<div className="space-y-2" key={k}>
							<div className="font-medium text-gray-700 text-sm">{k}</div>
							<div className="flex items-center gap-2">
								<input
									className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
									onChange={(e) => updateColor([k, "name"], e.target.value)}
									placeholder="Name"
									value={(draft as any)?.[k]?.name ?? ""}
								/>
								<input
									className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
									onChange={(e) => updateColor([k, "hex"], e.target.value)}
									placeholder="#000000"
									value={(draft as any)?.[k]?.hex ?? ""}
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
					className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-black/90 disabled:opacity-60"
					disabled={!ctx.selected || ctx.isSaving}
					onClick={() => ctx.saveSelected(draft)}
					type="button"
				>
					{ctx.isSaving ? "Saving..." : "Save"}
				</button>
			</div>
		</div>
	);
}
