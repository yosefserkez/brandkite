import { useEffect, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type UseBrandModuleResult from "../../hooks/useBrandModule";
import { useBrandModule } from "../../hooks/useBrandModule";
import { BlockWrapper } from "./BlockWrapper";
import { ModuleCard } from "./ModuleCard";

type ValuesModuleProps = {
	companyId: Id<"companies">;
};

export default function ValuesModule({ companyId }: ValuesModuleProps) {
	const ctx = useBrandModule(companyId, "values");

	return (
		<BlockWrapper ctx={ctx}>
			<ModuleCard icon="💎" title="Values">
				<ValuesModuleBody ctx={ctx} />
			</ModuleCard>
		</BlockWrapper>
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
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
						key={`value-${i}-${v}`}
						onChange={(e) => updateAt(i, e.target.value)}
						value={v}
					/>
				))}
				<button
					className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm hover:bg-gray-50"
					onClick={() => setDraft([...draft, ""])}
					type="button"
				>
					Add value
				</button>
			</div>
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
