import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandPalette } from "../../../convex/modules/colors";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { cn, replaceCompanyName } from "../../lib/utils";
import { Button } from "../ui/button";
import { BlockWrapper } from "./BlockWrapper";

type ColorsModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

type PaletteVariant = "full" | "compact";

const SKELETON_COLOR_COLUMNS = 3;
const SKELETON_SHADE_ROWS = 6;

export default function ColorsModule({
	companyId,
	className,
}: ColorsModuleProps) {
	const ctx = useBrandModule(companyId, "colors");
	const companyName = useCompanyBrandName(companyId);
	const palette = ctx.selected?.data as BrandPalette | undefined;
	const [variant, setVariant] = useState<PaletteVariant>("full");

	const onCopy = () => {
		if (!palette) {
			return;
		}
		const text = [
			replaceCompanyName(palette.overview, companyName),
			"",
			replaceCompanyName(palette.howToUse, companyName),
			"",
			...palette.colors.map(
				(color) =>
					`${color.name} (${color.hex}): ${color.summary} Use: ${color.usage}`
			),
		].join("\n");
		navigator.clipboard.writeText(text);
	};

	const hasPalette = Boolean(palette?.colors?.length ?? false);

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<PaletteSkeleton />}
		>
			<div className="flex h-full flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
				<PaletteHeader
					companyName={companyName ?? ""}
					hasPalette={hasPalette}
					onVariantChange={setVariant}
					palette={palette}
					variant={variant}
				/>
				{hasPalette ? (
					<PaletteBody
						companyName={companyName ?? ""}
						palette={palette as BrandPalette}
						variant={variant}
					/>
				) : (
					<EmptyState />
				)}
			</div>
		</BlockWrapper>
	);
}

function PaletteHeader(props: {
	hasPalette: boolean;
	onVariantChange: (variant: PaletteVariant) => void;
	palette?: BrandPalette;
	companyName: string;
	variant: PaletteVariant;
}) {
	const { palette, variant, onVariantChange, hasPalette, companyName } = props;
	return (
		<header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
			<div className="space-y-3">
				<div>
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Brand palette
					</p>
					<h2 className="font-semibold text-2xl text-gray-900">Color system</h2>
				</div>
				{palette ? (
					<div className="space-y-2 text-gray-700 text-sm">
						<p>{replaceCompanyName(palette.overview, companyName)}</p>
						<p className="text-gray-600">
							{replaceCompanyName(palette.howToUse, companyName)}
						</p>
					</div>
				) : (
					<p className="text-gray-500 text-sm">
						AI is generating your color palette. This usually takes a few
						seconds.
					</p>
				)}
			</div>
			<div className="flex items-center gap-2 self-start rounded-full border border-gray-200 bg-gray-50 p-1">
				<ToggleButton
					disabled={!hasPalette}
					isActive={variant === "full"}
					label="Full view"
					onClick={() => onVariantChange("full")}
				/>
				<ToggleButton
					disabled={!hasPalette}
					isActive={variant === "compact"}
					label="Compact"
					onClick={() => onVariantChange("compact")}
				/>
			</div>
		</header>
	);
}

function PaletteBody(props: {
	companyName: string;
	palette: BrandPalette;
	variant: PaletteVariant;
}) {
	const { palette, variant, companyName } = props;

	if (variant === "compact") {
		return (
			<CompactPaletteView colors={palette.colors} companyName={companyName} />
		);
	}

	return <FullPaletteView colors={palette.colors} companyName={companyName} />;
}

function FullPaletteView({
	colors,
	companyName,
}: {
	colors: BrandPalette["colors"];
	companyName: string;
}) {
	return (
		<div className="grid gap-6 lg:grid-cols-3">
			{colors.map((color) => (
				<div
					className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-sm"
					key={color.name}
				>
					<div className="flex flex-1 flex-col">
						{color.scale.map((shade) => (
							<PaletteShadeRow key={shade.stop} shade={shade} />
						))}
					</div>
					<div className="space-y-3 bg-white px-5 py-5">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
									{replaceCompanyName(color.role, companyName)}
								</p>
								<h3 className="font-semibold text-gray-900 text-xl">
									{color.name}
								</h3>
							</div>
							<code className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-700 text-xs">
								{color.hex}
							</code>
						</div>
						<p className="text-gray-700 text-sm">
							{replaceCompanyName(color.summary, companyName)}
						</p>
						<div className="space-y-1">
							<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
								Usage
							</p>
							<p className="text-gray-600 text-sm">
								{replaceCompanyName(color.usage, companyName)}
							</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function CompactPaletteView({
	colors,
	companyName,
}: {
	colors: BrandPalette["colors"];
	companyName: string;
}) {
	return (
		<div className="space-y-5">
			{colors.map((color) => (
				<div
					className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm"
					key={color.name}
				>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
								{color.role}
							</p>
							<h3 className="font-semibold text-gray-900 text-lg">
								{replaceCompanyName(color.name, companyName)}
							</h3>
							<p className="text-gray-600 text-sm">
								{replaceCompanyName(color.summary, companyName)}
							</p>
						</div>
						<div className="flex flex-col items-end gap-1">
							<code className="rounded bg-white px-2 py-1 font-mono text-gray-700 text-xs shadow-sm">
								{replaceCompanyName(color.hex, companyName)}
							</code>
							<span className="text-gray-500 text-xs">
								{color.scale.length} shades
							</span>
						</div>
					</div>
					<div className="flex overflow-hidden rounded-full border border-gray-200">
						{color.scale.map((shade) => (
							<div
								className="h-10 flex-1"
								key={shade.stop}
								style={{ backgroundColor: shade.hex }}
							/>
						))}
					</div>
					<p className="text-gray-600 text-sm">
						{replaceCompanyName(color.usage, companyName)}
					</p>
				</div>
			))}
		</div>
	);
}

function PaletteShadeRow({
	shade,
}: {
	shade: BrandPalette["colors"][number]["scale"][number];
}) {
	const textColor = useMemo(
		() => getAccessibleTextColor(shade.hex),
		[shade.hex]
	);

	return (
		<div
			className="flex h-10 items-center justify-between px-4 font-medium text-sm"
			style={{
				backgroundColor: shade.hex,
				color: textColor,
			}}
		>
			<span>{shade.stop}</span>
			<span className="font-mono text-xs opacity-80">{shade.hex}</span>
		</div>
	);
}

function ToggleButton(props: {
	disabled?: boolean;
	isActive: boolean;
	label: string;
	onClick: () => void;
}) {
	const { disabled, onClick, label, isActive } = props;
	return (
		<Button
			className={cn(
				"h-8 rounded-full px-3 font-medium text-xs",
				isActive ? "bg-gray-900 text-white" : "bg-transparent text-gray-600"
			)}
			disabled={disabled}
			onClick={onClick}
			type="button"
			variant="ghost"
		>
			{label}
		</Button>
	);
}

function getAccessibleTextColor(hex: string): string {
	const normalized = hex.replace("#", "");
	const r = Number.parseInt(normalized.slice(0, 2), 16);
	const g = Number.parseInt(normalized.slice(2, 4), 16);
	const b = Number.parseInt(normalized.slice(4, 6), 16);

	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.65 ? "#111827" : "#F9FAFB";
}

function PaletteSkeleton() {
	return (
		<div className="flex h-full animate-pulse flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6">
			<div className="space-y-3">
				<div className="h-3 w-20 rounded bg-gray-200" />
				<div className="h-6 w-40 rounded bg-gray-200" />
				<div className="h-3 w-full rounded bg-gray-200" />
				<div className="h-3 w-5/6 rounded bg-gray-200" />
			</div>
			<div className="grid flex-1 gap-4 lg:grid-cols-3">
				{Array.from({ length: SKELETON_COLOR_COLUMNS }).map(
					(_, columnIndex) => (
						<div
							className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3"
							key={columnIndex}
						>
							{Array.from({ length: SKELETON_SHADE_ROWS }).map(
								(__, rowIndex) => (
									<div
										className={cn(
											"h-8 rounded",
											rowIndex % 2 === 0 ? "bg-gray-200" : "bg-gray-100"
										)}
										key={`${columnIndex}-${rowIndex}`}
									/>
								)
							)}
						</div>
					)
				)}
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 border-dashed bg-gray-50 px-6 py-12 text-center">
			<div className="space-y-3">
				<p className="font-medium text-gray-600 text-sm">Palette on the way</p>
				<p className="text-gray-500 text-sm">
					We&apos;re compiling color insights from your brand context. Refresh
					in a moment to see the full palette.
				</p>
			</div>
		</div>
	);
}
