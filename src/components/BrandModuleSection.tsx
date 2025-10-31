import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type {
	ApplicationsData,
	FoundationsData,
	GovernanceData,
	VerbalData,
	VisualData,
} from "../../convex/brandModuleSchemas";
import { BrandModuleModal } from "./BrandModuleModal";

interface BrandModuleSectionProps {
	companyId: Id<"companies">;
	moduleType:
		| "foundations"
		| "visual"
		| "verbal"
		| "applications"
		| "governance";
	title: string;
	icon: string;
	data?:
		| FoundationsData
		| VisualData
		| VerbalData
		| ApplicationsData
		| GovernanceData;
	version: number;
}

export function BrandModuleSection({
	companyId,
	moduleType,
	title,
	icon,
	data,
	version,
}: BrandModuleSectionProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const regenerateModule = useMutation(api.brandModules.regenerateModule);
	const [isRegenerating, setIsRegenerating] = useState(false);

	const handleRegenerate = async () => {
		setIsRegenerating(true);
		try {
			await regenerateModule({ companyId, type: moduleType });
		} finally {
			setIsRegenerating(false);
		}
	};

	const renderPreview = () => {
		if (!data) {
			return (
				<div className="text-gray-500 italic">
					AI is generating this module...
				</div>
			);
		}

		console.log("data", data);

		switch (moduleType) {
			case "foundations": {
				const foundationsData = data as FoundationsData;
				return (
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="font-medium">Mission:</span>{" "}
							{foundationsData.mission?.substring(0, 100)}...
						</div>
						<div>
							<span className="font-medium">Vision:</span>{" "}
							{foundationsData.vision?.substring(0, 100)}...
						</div>
						{foundationsData.tagline && (
							<div>
								<span className="font-medium">Tagline:</span>{" "}
								{foundationsData.tagline}
							</div>
						)}
					</div>
				);
			}
			case "visual": {
				const visualData = data as VisualData;
				const colorSwatches = [];
				if (visualData.colors?.primary) {
					colorSwatches.push(visualData.colors.primary);
				}
				if (visualData.colors?.secondary) {
					colorSwatches.push(visualData.colors.secondary);
				}
				if (visualData.colors?.accent) {
					colorSwatches.push(visualData.colors.accent);
				}
				if (visualData.colors?.additional) {
					colorSwatches.push(...visualData.colors.additional);
				}

				return (
					<div className="flex items-center space-x-4">
						{colorSwatches.length > 0 && (
							<div className="flex space-x-2">
								{colorSwatches.slice(0, 5).map((color) => (
									<div
										key={`${color.name}-${color.hex}`}
										className="w-8 h-8 rounded-full border border-gray-200"
										style={{ backgroundColor: color.hex }}
										title={color.name}
									/>
								))}
							</div>
						)}
						<div className="text-sm">
							<div className="font-medium">Typography:</div>
							<div className="text-gray-600">
								{visualData.typography?.primary?.font || "Not set"}
							</div>
						</div>
					</div>
				);
			}
			case "verbal": {
				const verbalData = data as VerbalData;
				return (
					<div className="text-sm">
						<div className="font-medium mb-2">Brand Voice:</div>
						<div className="text-gray-600">
							{verbalData.voice?.substring(0, 150)}...
						</div>
						{verbalData.story && (
							<div className="mt-2">
								<div className="font-medium mb-1">Brand Story:</div>
								<div className="text-gray-600">
									{verbalData.story.substring(0, 100)}...
								</div>
							</div>
						)}
					</div>
				);
			}
			case "applications": {
				const applicationsData = data as ApplicationsData;
				return (
					<div className="text-sm text-gray-600">
						<div className="grid grid-cols-2 gap-2">
							{applicationsData.website && (
								<div>
									<span className="font-medium">Website:</span>{" "}
									{applicationsData.website.substring(0, 50)}...
								</div>
							)}
							{applicationsData.social && (
								<div>
									<span className="font-medium">Social:</span>{" "}
									{applicationsData.social.substring(0, 50)}...
								</div>
							)}
							{applicationsData.collateral && (
								<div>
									<span className="font-medium">Collateral:</span>{" "}
									{applicationsData.collateral.substring(0, 50)}...
								</div>
							)}
							{applicationsData.email && (
								<div>
									<span className="font-medium">Email:</span>{" "}
									{applicationsData.email.substring(0, 50)}...
								</div>
							)}
						</div>
					</div>
				);
			}
			case "governance": {
				const governanceData = data as GovernanceData;
				return (
					<div className="text-sm text-gray-600">
						<div className="grid grid-cols-2 gap-2">
							{governanceData.versioning && (
								<div>
									<span className="font-medium">Versioning:</span>{" "}
									{governanceData.versioning.substring(0, 50)}...
								</div>
							)}
							{governanceData.styleGuide && (
								<div>
									<span className="font-medium">Style Guide:</span>{" "}
									{governanceData.styleGuide.substring(0, 50)}...
								</div>
							)}
							{governanceData.access && (
								<div>
									<span className="font-medium">Access Rules:</span>{" "}
									{governanceData.access.substring(0, 50)}...
								</div>
							)}
							{governanceData.approvals && (
								<div>
									<span className="font-medium">Approvals:</span>{" "}
									{governanceData.approvals.substring(0, 50)}...
								</div>
							)}
						</div>
					</div>
				);
			}
			default:
				return (
					<div className="text-sm text-gray-600">
						{Object.keys(data).length} items configured
					</div>
				);
		}
	};

	return (
		<>
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
				>
					<div className="flex items-center space-x-3">
						<span className="text-2xl">{icon}</span>
						<div className="text-left">
							<h3 className="font-semibold text-gray-900">{title}</h3>
							<p className="text-sm text-gray-500">Version {version}</p>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setShowModal(true);
							}}
							className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							Edit
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleRegenerate();
							}}
							disabled={isRegenerating}
							className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
						>
							{isRegenerating ? "..." : "Regenerate"}
						</button>
						<svg
							className={`w-5 h-5 text-gray-400 transition-transform ${
								isExpanded ? "rotate-180" : ""
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label={isExpanded ? "Collapse" : "Expand"}
						>
							<title>{isExpanded ? "Collapse" : "Expand"}</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</button>

				{isExpanded && (
					<div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
						{renderPreview()}
					</div>
				)}
			</div>

			{showModal && (
				<BrandModuleModal
					companyId={companyId}
					moduleType={moduleType}
					title={title}
					data={data}
					onClose={() => setShowModal(false)}
				/>
			)}
		</>
	);
}
