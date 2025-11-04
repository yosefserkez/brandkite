import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";
import { BlockWrapper } from "./BlockWrapper";
import { ModuleCard } from "./ModuleCard";

type VisionModuleProps = {
	companyId: Id<"companies">;
};

export default function VisionModule({ companyId }: VisionModuleProps) {
	const ctx = useBrandModule(companyId, "vision");

	return (
		<BlockWrapper ctx={ctx}>
			<ModuleCard icon="🔭" title="Vision">
				<div className="space-y-3">
					<textarea
						className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
						onChange={(e) => ctx.saveSelected(e.target.value)}
						rows={6}
						value={
							typeof ctx.selected?.data === "string"
								? (ctx.selected.data as string)
								: ""
						}
					/>
				</div>
			</ModuleCard>
		</BlockWrapper>
	);
}
