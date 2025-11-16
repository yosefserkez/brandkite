import type { BrandModuleType } from "@convex/workflows";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ContextForm } from "@/components/new-company/context-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBrandModule } from "@/hooks/useBrandModule";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandContext } from "../../../convex/modules/brandContext";
import { BrandModuleTypes } from "../../../convex/workflows";

type EditBrandContextDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	companyId: Id<"companies">;
};

export function EditBrandContextDialog({
	open,
	onOpenChange,
	companyId,
}: EditBrandContextDialogProps) {
	const moduleType: BrandModuleType = BrandModuleTypes.BrandContext;
	const { selected, saveSelected, isSaving } = useBrandModule(
		companyId,
		moduleType
	);

	// Keep a local editable copy of the context data
	const initialData = useMemo(
		() => (selected?.data as BrandContext | undefined) ?? null,
		[selected]
	);
	const [draft, setDraft] = useState<BrandContext | null>(initialData);

	useEffect(() => {
		setDraft(initialData);
	}, [initialData]);

	const hasChanges = useMemo(() => {
		if (!(draft || initialData)) {
			return false;
		}
		return JSON.stringify(draft) !== JSON.stringify(initialData);
	}, [draft, initialData]);

	const handleSave = async () => {
		if (!draft) {
			toast.error("Nothing to save");
			return;
		}
		try {
			await saveSelected(draft);
			toast.success("Context saved");
			onOpenChange(false);
		} catch (e) {
			toast.error("Failed to save");
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
				<ScrollArea className="flex flex-1 flex-col justify-between overflow-hidden">
					<div className="pt-10">
						{draft && (
							<ContextForm
								brandContext={draft}
								isSubmitting={isSaving}
								onBrandContextChange={setDraft}
								onSubmit={handleSave}
								submitLabel="Save"
								submitVariant="simple"
							/>
						)}
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
