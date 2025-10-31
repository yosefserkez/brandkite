import type { Id } from "../../../convex/_generated/dataModel";
import { ModuleCard } from "./ModuleCard";

interface GenericModuleProps {
	companyId: Id<"companies">;
	moduleType?: string;
	title?: string;
	icon?: string;
}

export default function GenericModule({
	companyId,
	moduleType,
	title = "Generic",
	icon = "🔧",
}: GenericModuleProps) {
	return (
		<ModuleCard
			companyId={companyId}
			moduleType={moduleType ?? ""}
			title={title ?? ""}
			icon={icon ?? ""}
		>
			{(ctx) => (
				<div className="space-y-3">
					<p>{JSON.stringify(ctx.selected?.data ?? null, null, 2)}</p>
				</div>
			)}
		</ModuleCard>
	);
}
