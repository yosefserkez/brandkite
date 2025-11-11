import { useAction, useMutation } from "convex/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { NameModuleData } from "../../../convex/modules/name";
import { useCompanyName } from "../../hooks/useCompanyName";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { BillboardPreviewWithOverlays } from "./BillboardPreviewWithOverlays";

const DEBOUNCE_DELAY_MS = 500;

type ChangeNameDialogProps = {
	companyId: Id<"companies">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	generatedNames: NameModuleData;
};

export function ChangeNameDialog({
	companyId,
	open,
	onOpenChange,
	generatedNames,
}: ChangeNameDialogProps) {
	const { name: currentName, updateName } = useCompanyName(companyId);
	const generateDomainsAction = useAction(api.modules.name.generateDomains);
	const regenerateModule = useMutation(api.brandModules.regenerateModule);

	const [selectedOption, setSelectedOption] = useState<"generated" | "custom">(
		"generated"
	);
	const [selectedNameIndex, setSelectedNameIndex] = useState(0);
	const [customName, setCustomName] = useState("");
	const [customDomains, setCustomDomains] = useState<string[]>([]);
	const [isCheckingDomains, setIsCheckingDomains] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isRegenerating, setIsRegenerating] = useState(false);

	// Find current name in generated names to pre-select
	useEffect(() => {
		if (currentName && generatedNames.length > 0) {
			const index = generatedNames.findIndex(
				(item) => item.name.name === currentName
			);
			if (index !== -1) {
				setSelectedNameIndex(index);
				setSelectedOption("generated");
			} else {
				// Current name is custom
				setSelectedOption("custom");
				setCustomName(currentName);
			}
		}
	}, [currentName, generatedNames]);

	// Check domains for custom name with debouncing
	useEffect(() => {
		if (selectedOption !== "custom" || !customName.trim()) {
			setCustomDomains([]);
			return;
		}

		const timeoutId = setTimeout(async () => {
			setIsCheckingDomains(true);
			try {
				const domains = await generateDomainsAction({
					name: customName,
					options: {
						tlds: ["com", "io", "ai", "co", "app", "net"],
						variants: {
							prefixes: ["get", "try", "use", "my"],
							suffixes: ["app", "hq", "labs"],
						},
						maxResults: 5,
					},
				});
				setCustomDomains(domains);
			} catch {
				// Domain check failed, show no domains available
				setCustomDomains([]);
			} finally {
				setIsCheckingDomains(false);
			}
		}, DEBOUNCE_DELAY_MS);

		return () => clearTimeout(timeoutId);
	}, [customName, selectedOption, generateDomainsAction]);

	const handleSubmit = async (nameToSave?: string) => {
		setIsSaving(true);
		try {
			const newName = nameToSave || customName.trim();

			if (!newName) {
				return;
			}

			await updateName(newName);
			onOpenChange(false);
		} catch {
			// Error updating name - could show a toast notification here
		} finally {
			setIsSaving(false);
		}
	};

	const handleRegenerate = async () => {
		setIsRegenerating(true);
		try {
			await regenerateModule({
				companyId,
				type: "name",
			});
		} catch {
			// Error regenerating - could show a toast notification here
		} finally {
			setIsRegenerating(false);
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="mb-8 flex h-[calc(100vh-2rem)] min-w-[calc(100vw-2rem)] flex-col justify-between gap-0 p-0">
				<DialogHeader className="contents space-y-0 text-left">
					{/* <DialogTitle className="px-6 pt-6">Change Brand Name</DialogTitle> */}
				</DialogHeader>
				<ScrollArea className="mx-auto flex w-full max-w-7xl flex-col justify-between overflow-hidden p-6 pb-0">
					<div className="">
						{/* Custom Name Section - Moved to top */}
						<div className="mb-6 space-y-4">
							<h3 className="font-semibold text-gray-900">Custom Name</h3>
							<div className="space-y-4">
								<Input
									className="ring-inset"
									onChange={(e) => {
										setCustomName(e.target.value);
										if (e.target.value.trim()) {
											setSelectedOption("custom");
										}
									}}
									onFocus={() => {
										if (customName.trim()) {
											setSelectedOption("custom");
										}
									}}
									placeholder="Enter your brand name"
									value={customName}
								/>

								{customName.trim() && (
									<div className="space-y-4">
										{/* Custom name billboard preview */}
										<BillboardPreviewWithOverlays
											bottomRightContent={
												<Button
													disabled={
														isSaving ||
														!customName.trim() ||
														currentName === customName
													}
													onClick={() => {
														setSelectedOption("custom");
														handleSubmit(customName.trim());
													}}
													size="xs"
													type="button"
													variant="outline"
												>
													{(() => {
														if (isSaving && selectedOption === "custom") {
															return "Setting...";
														}
														if (currentName === customName) {
															return "Current";
														}
														return "Set Live";
													})()}
												</Button>
											}
											company={{ name: customName }}
											containerHeight="400px"
											nameData={
												customDomains.length > 0
													? {
															name: {
																name: customName,
																reasoning: {
																	summary: "",
																	details: "",
																},
															},
															domains: customDomains,
														}
													: undefined
											}
											showReasoningDetails={false}
										/>

										{/* Custom domain states overlay */}
										{isCheckingDomains && (
											<div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin text-white" />
												<span className="text-sm text-white">
													Checking domains...
												</span>
											</div>
										)}

										{!isCheckingDomains && customDomains.length === 0 && (
											<div className="absolute bottom-4 left-4 z-10">
												<span className="text-sm text-white/80">
													No available domains
												</span>
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Generated Names Section */}
						{generatedNames.length > 0 && (
							<div className="space-y-4 border-gray-200 border-t pt-6">
								<h3 className="font-semibold text-gray-900">
									AI Generated Names
								</h3>
								<div className="grid grid-cols-1 gap-6">
									{generatedNames.map((item, idx) => (
										<BillboardPreviewWithOverlays
											bottomRightContent={
												<Button
													disabled={isSaving || currentName === item.name.name}
													onClick={() => {
														setSelectedOption("generated");
														setSelectedNameIndex(idx);
														handleSubmit(item.name.name);
													}}
													size="xs"
													type="button"
													variant="outline"
												>
													{(() => {
														if (
															isSaving &&
															selectedOption === "generated" &&
															selectedNameIndex === idx
														) {
															return "Setting...";
														}
														if (currentName === item.name.name) {
															return "Current";
														}
														return "Set Live";
													})()}
												</Button>
											}
											company={{ name: item.name.name }}
											containerHeight="400px"
											key={`name-${item.name.name}-${idx}`}
											nameData={item}
										/>
									))}
								</div>
							</div>
						)}

						{/* Regenerate Button Section */}
						<div className="my-6 flex justify-center">
							<Button
								disabled={isRegenerating}
								onClick={handleRegenerate}
								size="sm"
								variant="outline"
							>
								{isRegenerating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										Generate New Names
									</>
								)}
							</Button>
						</div>
					</div>
				</ScrollArea>
				{/* <DialogFooter className="px-6 pb-6 sm:justify-start">
					<DialogClose asChild>
						<Button variant="outline">
							<ChevronLeftIcon />
							Back
						</Button>
					</DialogClose>
				</DialogFooter> */}
			</DialogContent>
		</Dialog>
	);
}
