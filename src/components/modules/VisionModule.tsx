import type { Id } from "../../../convex/_generated/dataModel";
import { ModuleCard } from "./ModuleCard";

interface VisionModuleProps {
	companyId: Id<"companies">;
}

export default function VisionModule({ companyId }: VisionModuleProps) {
	return (
		<ModuleCard
			companyId={companyId}
			moduleType="vision"
			title="Vision"
			icon="🔭"
		>
			{(ctx) => (
				<div className="space-y-3">
					<textarea
						className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
						rows={6}
						value={
							typeof ctx.selected?.data === "string"
								? (ctx.selected.data as string)
								: ""
						}
						onChange={(e) => ctx.saveSelected(e.target.value)}
					/>
				</div>
			)}
		</ModuleCard>
	);
}
