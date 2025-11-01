import { useAction, useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CreateCompanyModalProps {
	onClose: () => void;
	onSuccess: (companyId: Id<"companies">) => void;
}

interface DocumentInput {
	type: "text" | "pdf" | "url";
	title?: string;
	content: string;
	extractedText?: string;
	parsing?: boolean;
	parseError?: string;
}

export function CreateCompanyModal({
	onClose,
	onSuccess,
}: CreateCompanyModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [urls, setUrls] = useState<string[]>([]);
	const [currentUrl, setCurrentUrl] = useState("");
	const [rawText, setRawText] = useState("");
	const [documents, setDocuments] = useState<DocumentInput[]>([]);
	const [isCreating, setIsCreating] = useState(false);

	const processInputs = useAction(api.companies.processCompanyInputs);
	const createCompany = useMutation(api.companies.create);

	const handleAddUrl = () => {
		if (currentUrl.trim()) {
			setUrls([...urls, currentUrl.trim()]);
			setCurrentUrl("");
		}
	};

	const handleRemoveUrl = (index: number) => {
		setUrls(urls.filter((_, i) => i !== index));
	};

	const parsePDF = async (file: File): Promise<string> => {
		const pdfjs = await import("pdfjs-dist");

		// Configure worker - use Vite's ?url to import worker as URL
		if (!pdfjs.GlobalWorkerOptions.workerSrc) {
			try {
				const workerModule = await import(
					"pdfjs-dist/build/pdf.worker.min.mjs?url"
				);
				pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
			} catch {
				// Fallback to CDN if local import fails
				pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
			}
		}

		const pdf = await pdfjs.getDocument({
			data: await file.arrayBuffer(),
			verbosity: 0, // Suppress console warnings
		}).promise;

		let fullText = "";

		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.map((item) => {
					// Type guard for TextItem with str property
					if ("str" in item && typeof item.str === "string") {
						return item.str;
					}
					return "";
				})
				.filter((text) => text.length > 0)
				.join(" ");
			if (pageText) {
				fullText += pageText + "\n\n";
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

	const parseTextFile = async (file: File): Promise<string> => {
		return await file.text();
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		for (const file of files) {
			let type: "text" | "pdf" | "url" = "text";
			const fileName = file.name.toLowerCase();

			if (fileName.endsWith(".pdf")) {
				type = "pdf";
			} else if (fileName.endsWith(".docx")) {
				type = "text";
			} else if (fileName.endsWith(".doc")) {
				type = "text";
			}

			const newDoc: DocumentInput = {
				type,
				title: file.name,
				content: file.name,
				parsing: true,
			};

			setDocuments([...documents, newDoc]);

			try {
				let extractedText = "";

				if (type === "pdf") {
					extractedText = await parsePDF(file);
				} else if (fileName.endsWith(".docx")) {
					extractedText = await parseDOCX(file);
				} else if (fileName.endsWith(".doc")) {
					extractedText =
						"[DOC file: Old Word format (.doc) is not supported. Please convert to .docx or .pdf]";
				} else {
					extractedText = await parseTextFile(file);
				}

				// Update the document with extracted text
				setDocuments((prev) =>
					prev.map((doc) =>
						doc.title === file.name
							? { ...doc, extractedText, parsing: false }
							: doc,
					),
				);
			} catch (error) {
				console.error(`Error parsing file ${file.name}:`, error);
				setDocuments((prev) =>
					prev.map((doc) =>
						doc.title === file.name
							? {
									...doc,
									parsing: false,
									parseError: `Failed to parse: ${error instanceof Error ? error.message : "Unknown error"}`,
								}
							: doc,
					),
				);
			}
		}
	};

	const handleRemoveDocument = (index: number) => {
		setDocuments(documents.filter((_, i) => i !== index));
	};

	const handleCreateCompany = async () => {
		if (!name.trim() || !description.trim()) {
			toast.error("Please provide company name and description");
			return;
		}

		// Check if any documents are still parsing
		const stillParsing = documents.some((d) => d.parsing);
		if (stillParsing) {
			toast.error("Please wait for all files to finish parsing");
			return;
		}

		// Check if any documents failed to parse
		const failedParsing = documents.filter((d) => d.parseError);
		if (failedParsing.length > 0) {
			toast.error(
				`${failedParsing.length} file(s) failed to parse. Please remove them or try again.`,
			);
			return;
		}

		setIsCreating(true);
		try {
			// Process inputs to get combined content string
			let inputContent: string | undefined;
			const hasInputs =
				urls.length > 0 || rawText.trim() || documents.length > 0;

			if (hasInputs) {
				inputContent = await processInputs({
					urls: urls.length > 0 ? urls : undefined,
					rawText: rawText.trim() || undefined,
					documents:
						documents.length > 0
							? documents
									.filter(
										(d): d is DocumentInput & { extractedText: string } =>
											!!d.extractedText,
									)
									.map((d) => ({
										type: d.type,
										title: d.title,
										content: d.extractedText,
									}))
							: undefined,
				});
			}

			// Create company with inputContent
			const companyId = await createCompany({
				name,
				description,
				isPublic,
				inputContent: inputContent || undefined,
			});
			toast.success("Company created! AI is generating your brand identity...");
			onSuccess(companyId);
			onClose();
		} catch (error) {
			console.error("Error creating company:", error);
			toast.error("Failed to create company");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
				<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
					<h2 className="text-xl font-semibold text-gray-900">
						Create New Company
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="px-6 py-4 overflow-y-auto flex-1">
					<div className="space-y-6">
						{/* Basic Info */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Basic Information</h3>
							<div className="space-y-3">
								<Input
									placeholder="Company name"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
								<textarea
									placeholder="Brief company description..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
									rows={3}
								/>
								<label className="flex items-center text-sm">
									<input
										type="checkbox"
										checked={isPublic}
										onChange={(e) => setIsPublic(e.target.checked)}
										className="mr-2"
									/>
									Public company
								</label>
							</div>
						</div>

						{/* URLs */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Website Links</h3>
							<div className="space-y-2">
								<div className="flex gap-2">
									<Input
										placeholder="https://example.com"
										value={currentUrl}
										onChange={(e) => setCurrentUrl(e.target.value)}
										onKeyPress={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddUrl();
											}
										}}
									/>
									<Button onClick={handleAddUrl}>Add</Button>
								</div>
								{urls.length > 0 && (
									<div className="space-y-1">
										{urls.map((url, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between p-2 bg-gray-50 rounded"
											>
												<span className="text-sm text-gray-700 truncate flex-1">
													{url}
												</span>
												<button
													onClick={() => handleRemoveUrl(idx)}
													className="text-red-600 hover:text-red-700 ml-2"
												>
													Remove
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Raw Text */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Raw Text</h3>
							<textarea
								placeholder="Paste any relevant text about your company..."
								value={rawText}
								onChange={(e) => setRawText(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
								rows={6}
							/>
						</div>

						{/* Documents */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Documents</h3>
							<div className="space-y-2">
								<Input
									type="file"
									accept=".txt,.pdf,.doc,.docx"
									onChange={handleFileUpload}
									multiple
								/>
								{documents.length > 0 && (
									<div className="space-y-1">
										{documents.map((doc, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between p-2 bg-gray-50 rounded"
											>
												<div className="flex items-center gap-2 flex-1">
													<span className="text-sm text-gray-700">
														{doc.title || doc.content}
													</span>
													{doc.parsing && (
														<span className="text-xs text-blue-600">
															Parsing...
														</span>
													)}
													{doc.extractedText && !doc.parsing && (
														<span className="text-xs text-green-600">
															✓ Parsed ({doc.extractedText.length} chars)
														</span>
													)}
													{doc.parseError && (
														<span className="text-xs text-red-600">
															✗ {doc.parseError}
														</span>
													)}
												</div>
												<button
													type="button"
													onClick={() => handleRemoveDocument(idx)}
													className="text-red-600 hover:text-red-700 ml-2"
													disabled={doc.parsing}
												>
													Remove
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleCreateCompany}
						disabled={
							isCreating ||
							!name.trim() ||
							!description.trim() ||
							documents.some((d) => d.parsing) ||
							documents.some((d) => d.parseError && !d.extractedText)
						}
					>
						{isCreating ? "Creating..." : "Create Company"}
					</Button>
				</div>
			</div>
		</div>
	);
}
