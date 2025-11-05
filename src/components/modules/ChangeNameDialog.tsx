import { useAction, useMutation } from "convex/react";
import { ChevronLeftIcon, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { NameModuleData } from "../../../convex/modules/name";
import { useCompanyName } from "../../hooks/useCompanyName";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "../ui/dialog";
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

	const handleSubmit = async () => {
		setIsSaving(true);
		try {
			const newName =
				selectedOption === "generated"
					? generatedNames[selectedNameIndex].name.name
					: customName.trim();

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
		} catch (error) {
			console.error("Error regenerating module", { error });

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
				<ScrollArea className="mx-auto flex w-full max-w-7xl flex-col justify-between overflow-hidden p-6">
					<div className="">
						{/* Custom Name Section - Moved to top */}
						<div className="mb-6 space-y-4">
							<h3 className="font-semibold text-gray-900">Custom Name</h3>
							<div className="space-y-4">
								<Input
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
										<div
											className={cn(
												"overflow-hidden rounded-lg border-2 transition-all",
												selectedOption === "custom"
													? "border-blue-500 ring-2 ring-blue-200"
													: "border-gray-200"
											)}
										>
											<BillboardPreviewWithOverlays
												bottomRightContent={
													<button
														className="pointer-events-auto rounded bg-gray-800/80 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
														disabled={
															isSaving ||
															!customName.trim() ||
															currentName === customName
														}
														onClick={() => {
															setSelectedOption("custom");
															handleSubmit();
														}}
														type="button"
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
													</button>
												}
												containerHeight="400px"
												name={customName}
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
										<button
											className={cn(
												"group relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg",
												selectedOption === "generated" &&
													selectedNameIndex === idx
													? "border-blue-500 ring-2 ring-blue-200"
													: "border-gray-200 hover:border-gray-300"
											)}
											key={`name-${item.name.name}-${idx}`}
											onClick={() => {
												setSelectedOption("generated");
												setSelectedNameIndex(idx);
											}}
											type="button"
										>
											{/* Billboard Preview with overlays */}
											<BillboardPreviewWithOverlays
												bottomRightContent={
													<button
														className="pointer-events-auto rounded bg-gray-800/80 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
														disabled={
															isSaving || currentName === item.name.name
														}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedOption("generated");
															setSelectedNameIndex(idx);
															handleSubmit();
														}}
														type="button"
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
													</button>
												}
												containerHeight="400px"
												name={item.name.name}
												nameData={item}
											/>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Regenerate Button Section */}
						<div className="mt-8 flex justify-center border-gray-200 border-t pt-6">
							<Button
								disabled={isRegenerating}
								onClick={handleRegenerate}
								size="lg"
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
				<DialogFooter className="px-6 pb-6 sm:justify-start">
					<DialogClose asChild>
						<Button variant="outline">
							<ChevronLeftIcon />
							Back
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
