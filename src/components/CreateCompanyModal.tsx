import { useAction, useMutation } from "convex/react";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { BrandContext } from "../../convex/modules/brandContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type CreateCompanyModalProps = {
	onClose: () => void;
	onSuccess?: () => void;
};

const URL_PATTERN = /^https?:\/\/.+/i;
const DEFAULT_NAME_MAX_LENGTH = 50;

type Step = "input" | "edit";

export function CreateCompanyModal({
	onClose,
	onSuccess,
}: CreateCompanyModalProps) {
	const [step, setStep] = useState<Step>("input");
	const [inputText, setInputText] = useState("");
	const [urls, setUrls] = useState<string[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [brandContext, setBrandContext] = useState<BrandContext | null>(null);

	// Form fields for company creation
	const [companyName, setCompanyName] = useState("");
	const [companyDescription, setCompanyDescription] = useState("");
	const [isPublic, setIsPublic] = useState(false);

	const processBrandInput = useAction(api.companies.processBrandInput);
	const createCompany = useMutation(api.companies.create);

	const isUrl = (text: string): boolean => URL_PATTERN.test(text.trim());

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setInputText(value);

		// Check if the input is a URL and it's the first/only thing entered
		if (value.trim() && isUrl(value) && !inputText) {
			// Add to URLs array and clear input
			const trimmedUrl = value.trim();
			if (!urls.includes(trimmedUrl)) {
				setUrls([...urls, trimmedUrl]);
				setInputText("");
			}
		}
	};

	const handleRemoveUrl = (index: number) => {
		setUrls(urls.filter((_, i) => i !== index));
	};

	const parsePDF = async (file: File): Promise<string> => {
		const pdfjs = await import("pdfjs-dist");

		if (!pdfjs.GlobalWorkerOptions.workerSrc) {
			try {
				const workerModule = await import(
					"pdfjs-dist/build/pdf.worker.min.mjs?url"
				);
				pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
			} catch {
				pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
			}
		}

		const pdf = await pdfjs.getDocument({
			data: await file.arrayBuffer(),
			verbosity: 0,
		}).promise;

		let fullText = "";

		for (let i = 1; i <= pdf.numPages; i += 1) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.map((item) => {
					if ("str" in item && typeof item.str === "string") {
						return item.str;
					}
					return "";
				})
				.filter((text) => text.length > 0)
				.join(" ");
			if (pageText) {
				fullText = `${fullText}${pageText}\n\n`;
			}
		}

		return fullText.trim();
	};

	const parseDOCX = async (file: File): Promise<string> => {
		const mammoth = await import("mammoth");
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammoth.extractRawText({ arrayBuffer });
		return result.value;
	};

	const parseTextFile = async (file: File): Promise<string> => file.text();

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		for (const file of files) {
			try {
				let extractedText = "";
				const fileName = file.name.toLowerCase();

				if (fileName.endsWith(".pdf")) {
					extractedText = await parsePDF(file);
				} else if (fileName.endsWith(".docx")) {
					extractedText = await parseDOCX(file);
				} else if (fileName.endsWith(".doc")) {
					toast.error(
						"Old Word format (.doc) is not supported. Please convert to .docx or .pdf"
					);
					continue;
				} else {
					extractedText = await parseTextFile(file);
				}

				setInputText((prev) => {
					const separator = prev ? "\n\n" : "";
					return `${prev}${separator}${extractedText}`;
				});
			} catch (_error) {
				toast.error(`Failed to parse ${file.name}`);
			}
		}
	};

	const handleGenerateContext = async () => {
		if (!inputText.trim() && urls.length === 0) {
			toast.error("Please provide some input or URLs");
			return;
		}

		setIsProcessing(true);
		try {
			const result = await processBrandInput({
				urls: urls.length > 0 ? urls : undefined,
				rawText: inputText.trim() || undefined,
			});
			setBrandContext(result);
			// Set default company name from the brand context summary
			if (result.summary && !companyName) {
				const firstSentence = result.summary.split(".")[0];
				setCompanyName(firstSentence.substring(0, DEFAULT_NAME_MAX_LENGTH));
			}
			toast.success("Brand context generated successfully!");
			setStep("edit");
		} catch (_error) {
			toast.error("Failed to process input");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCreateCompany = async () => {
		if (!companyName.trim()) {
			toast.error("Please enter a company name");
			return;
		}

		if (!brandContext) {
			toast.error("No brand context available");
			return;
		}

		setIsProcessing(true);
		try {
			await createCompany({
				name: companyName,
				description: companyDescription,
				isPublic,
				brandContext,
			});
			toast.success("Company created successfully!");
			onSuccess?.();
			onClose();
		} catch (_error) {
			toast.error("Failed to create company");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleBack = () => {
		setStep("input");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white">
				<div className="flex items-center justify-between border-gray-200 border-b px-6 py-4">
					<h2 className="font-semibold text-gray-900 text-xl">
						{step === "input"
							? "Generate Brand Context"
							: "Create Company & Edit Brand Context"}
					</h2>
					<button
						className="text-gray-400 hover:text-gray-600"
						onClick={onClose}
						type="button"
					>
						<svg
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Close</title>
							<path
								d="M6 18L18 6M6 6l12 12"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
							/>
						</svg>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4">
					{step === "input" ? (
						<div className="space-y-4">
							{urls.length > 0 && (
								<div>
									<h3 className="mb-2 font-medium text-gray-700 text-sm">
										URLs to Process
									</h3>
									<div className="space-y-1">
										{urls.map((url) => (
											<div
												className="flex items-center justify-between rounded bg-gray-50 p-2"
												key={url}
											>
												<span className="flex-1 truncate text-gray-700 text-sm">
													{url}
												</span>
												<button
													className="ml-2 text-red-600 hover:text-red-700"
													onClick={() => handleRemoveUrl(urls.indexOf(url))}
													type="button"
												>
													Remove
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							<div>
								<div className="mb-2 flex items-center justify-between">
									<span className="font-medium text-gray-700 text-sm">
										Enter URLs or text about your brand
									</span>
									<label
										className="flex cursor-pointer items-center gap-2 text-blue-600 text-sm hover:text-blue-700"
										htmlFor="file-upload"
									>
										<Upload className="h-4 w-4" />
										Upload files
										<input
											accept=".txt,.pdf,.docx"
											className="hidden"
											id="file-upload"
											multiple
											onChange={handleFileUpload}
											type="file"
										/>
									</label>
								</div>
								<textarea
									className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									onChange={handleInputChange}
									placeholder="Paste a URL (it will be added to the list above) or enter text about your company, product, team, or brand..."
									rows={8}
									value={inputText}
								/>
								<p className="mt-1 text-gray-500 text-xs">
									URLs pasted as the first input will be automatically added to
									the list above
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							<div className="space-y-4">
								<div>
									<label
										className="mb-1 block font-medium text-gray-700 text-sm"
										htmlFor="company-name"
									>
										Company Name *
									</label>
									<Input
										id="company-name"
										onChange={(e) => setCompanyName(e.target.value)}
										placeholder="Enter company name"
										type="text"
										value={companyName}
									/>
								</div>

								<div>
									<label
										className="mb-1 block font-medium text-gray-700 text-sm"
										htmlFor="company-description"
									>
										Description
									</label>
									<textarea
										className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
										id="company-description"
										onChange={(e) => setCompanyDescription(e.target.value)}
										placeholder="Enter a brief description (optional)"
										rows={2}
										value={companyDescription}
									/>
								</div>

								<div className="flex items-center gap-2">
									<input
										checked={isPublic}
										className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										id="is-public"
										onChange={(e) => setIsPublic(e.target.checked)}
										type="checkbox"
									/>
									<label
										className="font-medium text-gray-700 text-sm"
										htmlFor="is-public"
									>
										Make this company public
									</label>
								</div>
							</div>

							{brandContext && (
								<div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
									<h3 className="font-semibold text-base text-gray-900">
										Brand Context
									</h3>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="summary"
										>
											Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													summary: e.target.value,
												})
											}
											rows={4}
											value={brandContext.summary}
										/>
									</div>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="product-summary"
										>
											Product Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="product-summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													product: { summary: e.target.value },
												})
											}
											rows={3}
											value={brandContext.product.summary}
										/>
									</div>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="market-summary"
										>
											Market Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="market-summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													market: {
														...brandContext.market,
														summary: e.target.value,
													},
												})
											}
											rows={3}
											value={brandContext.market.summary}
										/>
									</div>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="customer-summary"
										>
											Customer Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="customer-summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													customer: { summary: e.target.value },
												})
											}
											rows={3}
											value={brandContext.customer.summary}
										/>
									</div>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="brand-summary"
										>
											Brand Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="brand-summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													brand: {
														...brandContext.brand,
														summary: e.target.value,
													},
												})
											}
											rows={3}
											value={brandContext.brand.summary}
										/>
									</div>

									<div>
										<label
											className="mb-1 block font-medium text-gray-700 text-sm"
											htmlFor="business-summary"
										>
											Business Summary
										</label>
										<textarea
											className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
											id="business-summary"
											onChange={(e) =>
												setBrandContext({
													...brandContext,
													business: { summary: e.target.value },
												})
											}
											rows={3}
											value={brandContext.business.summary}
										/>
									</div>

									<details className="rounded border border-gray-300 bg-white">
										<summary className="cursor-pointer px-3 py-2 font-medium text-gray-700 text-sm">
											View Full JSON (Advanced)
										</summary>
										<pre className="max-h-64 overflow-auto border-gray-300 border-t bg-gray-50 p-3 text-xs">
											{JSON.stringify(brandContext, null, 2)}
										</pre>
									</details>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="flex justify-between gap-3 border-gray-200 border-t px-6 py-4">
					<div>
						{step === "edit" && (
							<Button onClick={handleBack} type="button" variant="outline">
								Back
							</Button>
						)}
					</div>
					<div className="flex gap-3">
						<Button onClick={onClose} variant="outline">
							Cancel
						</Button>
						{step === "input" ? (
							<Button
								disabled={
									isProcessing || (!inputText.trim() && urls.length === 0)
								}
								onClick={handleGenerateContext}
								type="button"
							>
								{isProcessing ? "Processing..." : "Generate Context"}
							</Button>
						) : (
							<Button
								disabled={isProcessing || !companyName.trim()}
								onClick={handleCreateCompany}
								type="button"
							>
								{isProcessing ? "Creating..." : "Create Company"}
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
