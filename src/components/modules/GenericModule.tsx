import type { BrandModuleType } from "@convex/workflows";
import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";
import { BlockWrapper } from "./BlockWrapper";
import { ModuleCard } from "./ModuleCard";

type GenericModuleProps = {
	companyId: Id<"companies">;
	moduleType?: BrandModuleType;
	title?: string;
	icon?: string;
};

export default function GenericModule({
	companyId,
	moduleType = "vision",
	title = "Generic",
	icon = "🔧",
}: GenericModuleProps) {
	const ctx = useBrandModule(companyId, moduleType);

	return (
		<BlockWrapper ctx={ctx}>
			<ModuleCard icon={icon} title={title}>
				<div className="space-y-3">
					<p>{JSON.stringify(ctx.selected?.data ?? null, null, 2)}</p>
				</div>
			</ModuleCard>
		</BlockWrapper>
	);
}
