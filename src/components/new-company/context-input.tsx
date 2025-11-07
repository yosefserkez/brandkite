"use client";

import { ArrowUp, Square, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	FileUpload,
	FileUploadContent,
	FileUploadTrigger,
} from "@/components/ui/file-upload";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { ShineBorder } from "@/components/ui/shine-border";
import { Source, SourceContent, SourceTrigger } from "@/components/ui/source";

type NewCompanyProps = {
	onSubmit: (data: {
		urls: string[];
		rawText: string;
		files: { name: string; text: string }[] | undefined;
	}) => void;
	onFocusChange?: (isFocused: boolean) => void;
};

const URL_PATTERN = /^https?:\/\/.+/i;
const BYTES_TO_KB = 1024;

export function NewCompany({ onSubmit, onFocusChange }: NewCompanyProps) {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [files, setFiles] = useState<Array<{ file: File; id: string }>>([]);
	const [urls, setUrls] = useState<string[]>([]);

	const isUrl = (text: string): boolean => URL_PATTERN.test(text.trim());

	const handleFilesAdded = async (newFiles: File[]) => {
		const parsedFiles: Array<{ file: File; id: string }> = [];

		for (const file of newFiles) {
			try {
				// Parse file content
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

				// Create a new file with extracted text
				const blob = new Blob([extractedText], { type: "text/plain" });
				const parsedFile = new File([blob], file.name, { type: "text/plain" });
				parsedFiles.push({
					file: parsedFile,
					id: `${file.name}-${Date.now()}-${Math.random()}`,
				});
			} catch (_error) {
				toast.error(`Failed to parse ${file.name}`);
			}
		}

		setFiles((prev) => [...prev, ...parsedFiles]);
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

	const handleInputChange = (value: string) => {
		setInput(value);

		// Check if the input is a URL and it's the first/only thing entered
		if (value.trim() && isUrl(value) && !input) {
			const trimmedUrl = value.trim();
			if (!urls.includes(trimmedUrl)) {
				setUrls([...urls, trimmedUrl]);
				setInput("");
			}
		}
	};

	const removeUrl = (urlToRemove: string) => {
		setUrls(urls.filter((url) => url !== urlToRemove));
	};

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((item) => item.id !== id));
	};

	const handleSubmit = async () => {
		if (!input.trim() && files.length === 0 && urls.length === 0) {
			toast.error("Please provide some input, URLs, or files");
			return;
		}

		setIsLoading(true);

		try {
			// Read all file contents
			const filesData = await Promise.all(
				files.map(async (item) => ({
					name: item.file.name,
					text: await item.file.text(),
				}))
			);

			onSubmit({
				urls,
				rawText: input.trim(),
				files: filesData,
			});
		} catch (_error) {
			toast.error("Failed to process files");
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<FileUpload accept=".pdf,.docx,.txt" onFilesAdded={handleFilesAdded}>
				<PromptInput
					className="relative w-full"
					isLoading={isLoading}
					maxHeight="300px"
					onFocusChange={onFocusChange}
					onSubmit={handleSubmit}
					onValueChange={handleInputChange}
					value={input}
				>
					<ShineBorder shineColor="black" />

					{(urls.length > 0 || files.length > 0) && (
						<div className="flex flex-row flex-wrap gap-2 p-2">
							{urls.map((url) => (
								<div className="flex items-center gap-1" key={url}>
									<Source href={url}>
										<SourceTrigger showIcon />
										<SourceContent
											description={url}
											title={new URL(url).hostname}
										/>
									</Source>
									<button
										className="rounded-full p-1 hover:bg-secondary"
										onClick={() => removeUrl(url)}
										type="button"
									>
										<X className="size-3" />
									</button>
								</div>
							))}
							{files.map(({ file, id }) => (
								<div className="flex items-center gap-1" key={id}>
									<Source fileName={file.name}>
										<SourceTrigger showIcon />
										<SourceContent
											description={`File size: ${(file.size / BYTES_TO_KB).toFixed(2)} KB`}
											title={file.name}
										/>
									</Source>
									<button
										className="rounded-full p-1 hover:bg-secondary"
										onClick={() => removeFile(id)}
										type="button"
									>
										<X className="size-3" />
									</button>
								</div>
							))}
						</div>
					)}

					<PromptInputTextarea
						className="min-h-[300px]"
						placeholder="Paste a URL, drop a file, or enter text about your idea, company, product, team, and brand..."
					/>

					<PromptInputActions className="flex items-center justify-between gap-2 pt-2">
						<PromptInputAction tooltip="Attach files">
							<FileUploadTrigger asChild>
								<div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl hover:bg-secondary-foreground/10">
									<svg
										className="size-5 text-primary"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Attach files</title>
										<path
											d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
										/>
									</svg>
								</div>
							</FileUploadTrigger>
						</PromptInputAction>

						<PromptInputAction
							tooltip={isLoading ? "Stop generation" : "Send message"}
						>
							<Button
								className="h-8 w-8 rounded-full"
								disabled={
									isLoading ||
									(!input.trim() && files.length === 0 && urls.length === 0)
								}
								onClick={handleSubmit}
								size="icon"
								variant="default"
							>
								{isLoading ? (
									<Square className="size-5 fill-current" />
								) : (
									<ArrowUp className="size-5" />
								)}
							</Button>
						</PromptInputAction>
					</PromptInputActions>
				</PromptInput>

				<FileUploadContent>
					<div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
						<div className="m-4 w-full max-w-md rounded-lg border bg-background/90 p-8 shadow-lg">
							<div className="mb-4 flex justify-center">
								<svg
									className="size-8 text-muted"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>File upload illustration</title>
									<path
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
							<h3 className="mb-2 text-center font-medium text-base">
								Drop files to upload
							</h3>
							<p className="text-center text-muted-foreground text-sm">
								Supported: PDF, DOCX, and TXT files
							</p>
						</div>
					</div>
				</FileUploadContent>
			</FileUpload>
		</div>
	);
}
