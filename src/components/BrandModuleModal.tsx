import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type BrandModuleModalProps = {
	companyId: Id<"companies">;
	moduleType:
		| "foundations"
		| "visual"
		| "verbal"
		| "applications"
		| "governance";
	title: string;
	data?: any;
	onClose: () => void;
};

export function BrandModuleModal({
	companyId,
	moduleType,
	title,
	data,
	onClose,
}: BrandModuleModalProps) {
	const [editedData, setEditedData] = useState(data || {});
	const [isSaving, setIsSaving] = useState(false);
	const updateModule = useMutation(api.brandModules.updateModule);

	useEffect(() => {
		setEditedData(data || {});
	}, [data]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateModule({
				companyId,
				type: moduleType,
				data: editedData,
			});
			onClose();
		} finally {
			setIsSaving(false);
		}
	};

	const renderEditor = () => {
		if (!data) {
			return (
				<div className="py-8 text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
					<p className="text-gray-600">AI is generating this module...</p>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				{Object.entries(editedData).map(([key, value]) => (
					<div key={key}>
						<label className="mb-2 block font-medium text-gray-700 text-sm capitalize">
							{key.replace(/([A-Z])/g, " $1").trim()}
						</label>
						{typeof value === "string" ? (
							value.length > 100 ? (
								<textarea
									className="w-full resize-none rounded-md border border-gray-300 px-3 py-2"
									onChange={(e) =>
										setEditedData({ ...editedData, [key]: e.target.value })
									}
									rows={4}
									value={value}
								/>
							) : (
								<input
									className="w-full rounded-md border border-gray-300 px-3 py-2"
									onChange={(e) =>
										setEditedData({ ...editedData, [key]: e.target.value })
									}
									type="text"
									value={value}
								/>
							)
						) : Array.isArray(value) ? (
							<div className="space-y-2">
								{value.map((item, index) => (
									<input
										className="w-full rounded-md border border-gray-300 px-3 py-2"
										key={index}
										onChange={(e) => {
											const newArray = [...value];
											newArray[index] = e.target.value;
											setEditedData({ ...editedData, [key]: newArray });
										}}
										type="text"
										value={
											typeof item === "string" ? item : JSON.stringify(item)
										}
									/>
								))}
								<button
									className="text-blue-600 text-sm hover:text-blue-700"
									onClick={() => {
										setEditedData({
											...editedData,
											[key]: [...value, ""],
										});
									}}
									type="button"
								>
									+ Add item
								</button>
							</div>
						) : (
							<textarea
								className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
								onChange={(e) => {
									try {
										const parsed = JSON.parse(e.target.value);
										setEditedData({ ...editedData, [key]: parsed });
									} catch {
										// Invalid JSON, don't update
									}
								}}
								rows={6}
								type="text"
								value={JSON.stringify(value, null, 2)}
							/>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white">
				<div className="flex items-center justify-between border-gray-200 border-b px-6 py-4">
					<h2 className="font-semibold text-gray-900 text-xl">{title}</h2>
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

				<div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-4">
					{renderEditor()}
				</div>

				<div className="flex justify-end space-x-3 border-gray-200 border-t px-6 py-4">
					<button
						className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={isSaving || !data}
						onClick={handleSave}
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	);
}
