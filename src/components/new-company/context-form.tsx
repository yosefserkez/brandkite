import { ArrowRightIcon, Plus, X } from "lucide-react";
import { useState } from "react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Source, SourceContent, SourceTrigger } from "@/components/ui/source";
import type { BrandContext } from "../../../convex/modules/brandContext";

const DOCUMENT_SUMMARY_MAX_LENGTH = 150;
const DOCUMENT_KEY_MAX_LENGTH = 50;

type ContextFormProps = {
	brandContext: BrandContext;
	onBrandContextChange: (context: BrandContext) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
};

type FormField = {
	name: string;
	placeholder: string;
	type?: "text" | "url" | "textarea";
	required?: boolean;
	rows?: number;
};

type AddItemPopoverProps = {
	title: string;
	fields: FormField[];
	onAdd: (data: Record<string, string>) => void;
	buttonLabel: string;
	buttonVariant?: "default" | "secondary" | "outline";
	buttonSize?: "default" | "xs" | "sm" | "lg";
	buttonClassName?: string;
};

function AddItemPopover({
	title,
	fields,
	onAdd,
	buttonLabel,
	buttonVariant = "secondary",
	buttonSize = "xs",
	buttonClassName,
}: AddItemPopoverProps) {
	const [open, setOpen] = useState(false);
	const [formData, setFormData] = useState<Record<string, string>>({});

	const handleSubmit = () => {
		const requiredFields = fields.filter((f) => f.required);
		const isValid = requiredFields.every((f) => Boolean(formData[f.name]));

		if (!isValid) {
			return;
		}

		onAdd(formData);
		setFormData({});
		setOpen(false);
	};

	const handleCancel = () => {
		setFormData({});
		setOpen(false);
	};

	const requiredFields = fields.filter((f) => f.required);
	const canSubmit = requiredFields.every((f) => Boolean(formData[f.name]));

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className={buttonClassName}
					size={buttonSize}
					type="button"
					variant={buttonVariant}
				>
					<Plus className={buttonSize === "lg" ? "size-4" : "size-3"} />
					{buttonLabel}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80">
				<div className="space-y-3">
					<h3 className="font-medium text-sm">{title}</h3>
					{fields.map((field) => {
						const Component = field.type === "textarea" ? "textarea" : "input";
						return (
							<Component
								className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
								key={field.name}
								onChange={(e) =>
									setFormData({ ...formData, [field.name]: e.target.value })
								}
								placeholder={field.placeholder}
								rows={field.rows}
								type={
									field.type === "textarea" ? undefined : field.type || "text"
								}
								value={formData[field.name] || ""}
							/>
						);
					})}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							onClick={handleCancel}
							size="sm"
							type="button"
							variant="ghost"
						>
							Cancel
						</Button>
						<Button
							disabled={!canSubmit}
							onClick={handleSubmit}
							size="sm"
							type="button"
						>
							Add
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

type ItemWithSource = {
	name: string;
	summary: string;
	url?: string;
	imageUrl?: string;
	role?: string;
};

export function ContextForm({
	brandContext,
	onBrandContextChange,
	onSubmit,
	isSubmitting,
}: ContextFormProps) {
	const updateField = (path: string[], value: string) => {
		const newContext = { ...brandContext };
		let current: Record<string, unknown> = newContext;
		for (let i = 0; i < path.length - 1; i += 1) {
			current = current[path[i]] as Record<string, unknown>;
		}
		const lastKey = path.at(-1);
		if (lastKey) {
			current[lastKey] = value;
		}
		onBrandContextChange(newContext);
	};

	const getNestedValue = (obj: unknown, path: string[]): unknown => {
		let current = obj;
		for (const key of path) {
			current = (current as Record<string, unknown>)?.[key];
		}
		return current;
	};

	const handleAddItem =
		(path: string[], transform: (data: Record<string, string>) => unknown) =>
		(data: Record<string, string>) => {
			const newContext = { ...brandContext };
			const items = (getNestedValue(newContext, path) as unknown[]) || [];
			items.push(transform(data));

			let current: Record<string, unknown> = newContext;
			for (let i = 0; i < path.length - 1; i += 1) {
				current = current[path[i]] as Record<string, unknown>;
			}
			const lastKey = path.at(-1);
			if (lastKey) {
				current[lastKey] = items;
			}
			onBrandContextChange(newContext);
		};

	const handleRemoveItem = (path: string[]) => (index: number) => {
		const newContext = { ...brandContext };
		const items = (getNestedValue(newContext, path) as unknown[]) || [];
		items.splice(index, 1);

		let current: Record<string, unknown> = newContext;
		for (let i = 0; i < path.length - 1; i += 1) {
			current = current[path[i]] as Record<string, unknown>;
		}
		const lastKey = path.at(-1);
		if (lastKey) {
			current[lastKey] = items;
		}
		onBrandContextChange(newContext);
	};

	const renderItemList = (
		items: ItemWithSource[] | undefined,
		onRemove: (index: number) => void,
		getLabel: (item: ItemWithSource) => string,
		getKey: (item: ItemWithSource, index: number) => string
	) =>
		items?.map((item, index) => {
			const label = getLabel(item);
			const key = getKey(item, index);

			return (
				<div className="group relative flex items-center" key={key}>
					<Source faviconUrl={item.imageUrl} href={item.url}>
						<SourceTrigger label={label} showIcon={true} />
						<SourceContent description={item.summary} title={item.name} />
					</Source>
					<button
						className="rounded-full p-1 hover:bg-secondary"
						onClick={() => onRemove(index)}
						type="button"
					>
						<X className="size-3" />
					</button>
				</div>
			);
		});

	const renderSection = (config: {
		title: string;
		summaryPath: string[];
		summaryValue: string;
		summaryPlaceholder: string;
		children?: React.ReactNode;
	}) => (
		<div className="grid lg:grid-cols-[200px_1fr] lg:gap-8">
			<div className="px-2 font-medium text-gray-500 lg:px-0 lg:pt-2">
				{config.title}
			</div>
			<div className="space-y-2">
				<textarea
					className="field-sizing-content w-full resize-none rounded-md px-3 py-2 hover:bg-accent"
					onChange={(e) => updateField(config.summaryPath, e.target.value)}
					placeholder={config.summaryPlaceholder}
					value={config.summaryValue}
				/>
				{config.children}
			</div>
		</div>
	);

	return (
		<div className="mx-auto w-full max-w-4xl p-2 text-sm">
			<div className="mb-8 px-2 lg:px-0">
				<h1 className="mb-2 font-bold text-3xl">Brand Context</h1>
				<p className="text-gray-600">
					Review and edit your brand information before creating the company.
				</p>
			</div>

			<div className="space-y-8">
				{/* Team Section */}
				{renderSection({
					title: "Team",
					summaryPath: ["summary"],
					summaryValue: brandContext.summary,
					summaryPlaceholder: "Team summary...",
					children: (
						<div className="flex flex-wrap items-center gap-2 px-2">
							{renderItemList(
								brandContext.team,
								handleRemoveItem(["team"]),
								(member) =>
									`${member.name}${member.role ? ` ${member.role}` : ""}`,
								(member) => member.name
							)}
							<AddItemPopover
								buttonClassName="text-xs"
								buttonLabel="Team Member"
								buttonVariant="secondary"
								fields={[
									{ name: "name", placeholder: "Name *", required: true },
									{ name: "role", placeholder: "Role" },
									{
										name: "url",
										placeholder: "URL (LinkedIn, website)",
										type: "url",
									},
									{ name: "imageUrl", placeholder: "Image URL", type: "url" },
								]}
								onAdd={handleAddItem(["team"], (data) => ({
									name: data.name,
									url: data.url || "",
									imageUrl: data.imageUrl || "",
									role: data.role || undefined,
								}))}
								title="Add Team Member"
							/>
						</div>
					),
				})}

				{/* Customer Section */}
				{renderSection({
					title: "Customer",
					summaryPath: ["customer", "summary"],
					summaryValue: brandContext.customer.summary,
					summaryPlaceholder: "Customer summary...",
				})}

				{/* Product Section */}
				{renderSection({
					title: "Product",
					summaryPath: ["product", "summary"],
					summaryValue: brandContext.product.summary,
					summaryPlaceholder: "Product summary...",
				})}

				{/* Market Section */}
				{renderSection({
					title: "Market",
					summaryPath: ["market", "summary"],
					summaryValue: brandContext.market.summary,
					summaryPlaceholder: "Market summary...",
					children: (
						<div className="flex flex-wrap items-center gap-2 px-2">
							{renderItemList(
								brandContext.market.competitors,
								handleRemoveItem(["market", "competitors"]),
								(competitor) => competitor.name,
								(competitor) => competitor.name
							)}
							<AddItemPopover
								buttonClassName="text-xs"
								buttonLabel="Competitor"
								buttonVariant="secondary"
								fields={[{ name: "url", placeholder: "URL", type: "url" }]}
								onAdd={handleAddItem(["market", "competitors"], (data) => ({
									url: data.url || "",
								}))}
								title="Add Competitor"
							/>
						</div>
					),
				})}

				{/* Business Section */}
				{renderSection({
					title: "Business",
					summaryPath: ["business", "summary"],
					summaryValue: brandContext.business.summary,
					summaryPlaceholder: "Business summary...",
				})}

				{/* Brand Section */}
				{renderSection({
					title: "Brand",
					summaryPath: ["brand", "summary"],
					summaryValue: brandContext.brand.summary,
					summaryPlaceholder: "Brand summary...",
					children: (
						<div className="flex flex-wrap items-center gap-2 px-2">
							{renderItemList(
								brandContext.brand.inspirations,
								handleRemoveItem(["brand", "inspirations"]),
								(inspiration) => inspiration.name,
								(inspiration) => inspiration.name
							)}
							<AddItemPopover
								buttonClassName="text-xs"
								buttonLabel="Brand Inspiration"
								buttonVariant="secondary"
								fields={[{ name: "url", placeholder: "URL", type: "url" }]}
								onAdd={handleAddItem(["brand", "inspirations"], (data) => ({
									url: data.url || "",
								}))}
								title="Add Brand Inspiration"
							/>
						</div>
					),
				})}

				{/* Documents Section */}
				<div className="grid lg:grid-cols-[200px_1fr] lg:gap-8">
					<div className="px-2 font-medium text-gray-500 lg:px-0 lg:pt-2">
						Documents
					</div>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2 px-2">
							{brandContext.documents.map((doc, index) => {
								const docKey =
									doc.url ||
									doc.name ||
									doc.summary.slice(0, DOCUMENT_KEY_MAX_LENGTH);
								const label = doc.name || "Document";

								return (
									<div
										className="group relative flex items-center"
										key={docKey}
									>
										<Source href={doc.url}>
											<SourceTrigger label={label} showIcon={true} />
											<SourceContent
												description={doc.summary.slice(
													0,
													DOCUMENT_SUMMARY_MAX_LENGTH
												)}
												title={label}
											/>
										</Source>
										<button
											className="rounded-full p-1 hover:bg-secondary"
											onClick={() => handleRemoveItem(["documents"])(index)}
											type="button"
										>
											<X className="size-3" />
										</button>
									</div>
								);
							})}
							<AddItemPopover
								buttonClassName="text-xs"
								buttonLabel="Document"
								buttonVariant="secondary"
								fields={[
									{ name: "name", placeholder: "Name" },
									{
										name: "summary",
										placeholder: "Text content...",
										type: "textarea",
										rows: 3,
									},
									{ name: "url", placeholder: "URL", type: "url" },
								]}
								onAdd={handleAddItem(["documents"], (data) => ({
									name: data.name || undefined,
									summary: data.summary,
									url: data.url || undefined,
								}))}
								title="Add Document"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Submit Button */}
			<div className="sticky bottom-0 mt-8 flex justify-end gap-3 bg-gray-50 py-4 backdrop-blur-sm">
				<div className="flex w-full items-center justify-between">
					<div>
						<p className="text-gray-500 text-xs">
							You can edit this information later in the company settings.
						</p>
						<a
							className="font-thin text-gray-400 text-xs underline-offset-2 hover:text-primary/80 hover:underline"
							href="/c/new"
						>
							Start again
						</a>
					</div>
					<Button
						className="group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
						disabled={isSubmitting}
						onClick={onSubmit}
						size="lg"
					>
						<AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-800 hover:duration-300 hover:dark:text-neutral-400">
							<span>✨ Create Company</span>
							<ArrowRightIcon className="mt-1 ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
						</AnimatedShinyText>
					</Button>
				</div>
			</div>
		</div>
	);
}
