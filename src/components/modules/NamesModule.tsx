import { Edit } from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { NameModuleData } from "../../../convex/modules/name";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyName } from "../../hooks/useCompanyName";
import { BillboardPreviewWithOverlays } from "./BillboardPreviewWithOverlays";
import { BlockWrapper } from "./BlockWrapper";
import { ChangeNameDialog } from "./ChangeNameDialog";

type NamesModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function NamesModule({
	companyId,
	className,
}: NamesModuleProps) {
	const ctx = useBrandModule(companyId, "name");
	const { name: liveName } = useCompanyName(companyId);
	const [showChangeDialog, setShowChangeDialog] = useState(false);

	const data = ctx.selected?.data as NameModuleData | undefined;
	const displayName = liveName ?? "Brand Name";

	// Find current name in generated names
	const currentNameData = data?.find((item) => item.name.name === liveName);

	return (
		<>
			<BlockWrapper
				actions={[
					{
						icon: <Edit className="h-3.5 w-3.5" />,
						label: "Change Name",
						onClick: () => setShowChangeDialog(true),
					},
				]}
				className="overflow-hidden rounded-lg"
				ctx={ctx}
				hideRegenerate
				hideVersionSelector
			>
				<BillboardPreviewWithOverlays
					className={className}
					containerHeight="320px"
					isLoading={!displayName}
					name={displayName}
					nameData={currentNameData}
				/>
			</BlockWrapper>

			{/* Change Name Dialog */}
			<ChangeNameDialog
				companyId={companyId}
				generatedNames={data ?? []}
				onOpenChange={setShowChangeDialog}
				open={showChangeDialog}
			/>
		</>
	);
}
