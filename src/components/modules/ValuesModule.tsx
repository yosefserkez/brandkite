import { useEffect, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { UseBrandModuleResult } from "../../hooks/useBrandModule";
import { ModuleCard } from "./ModuleCard";

interface ValuesModuleProps {
	companyId: Id<"companies">;
}

export default function ValuesModule({ companyId }: ValuesModuleProps) {
	return (
		<ModuleCard
			companyId={companyId}
			moduleType="values"
			title="Values"
			icon="💎"
		>
			{(ctx) => <ValuesModuleBody ctx={ctx} />}
		</ModuleCard>
	);
}

function ValuesModuleBody({ ctx }: { ctx: UseBrandModuleResult }) {
	const [draft, setDraft] = useState<string[]>([]);

	useEffect(() => {
		if (Array.isArray(ctx.selected?.data)) {
			setDraft((ctx.selected?.data as unknown[]).map(String));
		} else {
			setDraft([]);
		}
	}, [ctx.selected]);

	const updateAt = (idx: number, value: string) => {
		const next = [...draft];
		next[idx] = value;
		setDraft(next);
	};

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{draft.map((v, i) => (
					<input
						key={`value-${i}-${v}`}
						className="px-3 py-2 text-sm rounded-md border border-gray-300 w-full"
						value={v}
						onChange={(e) => updateAt(i, e.target.value)}
					/>
				))}
				<button
					type="button"
					className="px-2.5 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
					onClick={() => setDraft([...draft, ""])}
				>
					Add value
				</button>
			</div>
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
