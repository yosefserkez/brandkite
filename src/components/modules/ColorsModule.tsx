import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandPalette } from "../../../convex/modules/colors";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import {
	BRAND_SHADE_BASE_STOP,
	type BrandColorScaleEntry,
	generateColorScale,
} from "../../lib/color-scale";
import { cn } from "../../lib/utils";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { BlockWrapper } from "./BlockWrapper";

type ColorsModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

const HEX_CHANNEL_LENGTH = 2;
const HEX_CHANNEL_GREEN_OFFSET = HEX_CHANNEL_LENGTH;
const HEX_CHANNEL_BLUE_OFFSET = HEX_CHANNEL_LENGTH * 2;
const HEX_RADIX = 16;
const RGB_COMPONENT_MAX = 255;
const LUMINANCE_RED_WEIGHT = 0.299;
const LUMINANCE_GREEN_WEIGHT = 0.587;
const LUMINANCE_BLUE_WEIGHT = 0.114;
const LUMINANCE_THRESHOLD = 0.65;
const DARK_TEXT_HEX = "#111827";
const LIGHT_TEXT_HEX = "#F9FAFB";

export default function ColorsModule({
	companyId,
	className,
}: ColorsModuleProps) {
	const ctx = useBrandModule(companyId, "colors");
	const { replace } = useBrandText();
	const palette = ctx.selected?.data as BrandPalette | undefined;

	const onCopy = () => {
		if (!palette) {
			return;
		}
		const text = [
			palette.overview,
			"",
			palette.howToUse,
			"",
			...palette.colors.map(
				(color) =>
					`${color.name} (${color.hex}): ${color.summary} Use: ${color.usage}`
			),
		].join("\n");
		navigator.clipboard.writeText(replace(text));
	};

	const colorsWithScale = useMemo(() => {
		if (!palette?.colors) {
			return [];
		}
		return palette.colors.map((color) => ({
			...color,
			scale: generateColorScale(color.hex),
		}));
	}, [palette]);

	const hasPalette = colorsWithScale.length > 0;

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Color system" />}
		>
			<Card>
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Color System
					</p>
					<div className="wrap-break-word text-gray-950 text-sm tracking-tight">
						<BrandText as="p">{palette?.overview ?? ""}</BrandText>
						<BrandText as="p" className="pt-2 text-gray-600">
							{palette?.howToUse ?? ""}
						</BrandText>
					</div>
				</CardHeader>
				<CardContent>
					{hasPalette && <PaletteBody colors={colorsWithScale} />}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}

type PaletteColorWithScale = BrandPalette["colors"][number] & {
	scale: BrandColorScaleEntry[];
};

function PaletteBody(props: { colors: PaletteColorWithScale[] }) {
	const { colors } = props;

	return <PaletteView colors={colors} />;
}

function PaletteView({ colors }: { colors: PaletteColorWithScale[] }) {
	return (
		<div className="grid gap-6 pt-8 lg:grid-cols-3">
			{colors.map((color) => {
				const { topShades, mainShade, bottomShades } = partitionColorScale(
					color.scale
				);

				if (!mainShade) {
					return null;
				}

				return (
					<div
						className="flex flex-col overflow-hidden rounded"
						key={color.name}
					>
						<div className="flex flex-col">
							{topShades.map((shade) => (
								<ShadeSwatch key={shade.stop} shade={shade} />
							))}
						</div>
						<MainShadeSwatch color={color} shade={mainShade} />
						<div className="flex flex-col">
							{bottomShades.map((shade) => (
								<ShadeSwatch key={shade.stop} shade={shade} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

type PartitionedColorScale = {
	topShades: BrandColorScaleEntry[];
	mainShade: BrandColorScaleEntry | undefined;
	bottomShades: BrandColorScaleEntry[];
};

function partitionColorScale(
	scale: BrandColorScaleEntry[]
): PartitionedColorScale {
	const topShades = scale.filter((shade) => shade.stop > BRAND_SHADE_BASE_STOP);
	const bottomShades = scale.filter(
		(shade) => shade.stop < BRAND_SHADE_BASE_STOP
	);
	const mainShade = scale.find((shade) => shade.stop === BRAND_SHADE_BASE_STOP);

	return {
		topShades,
		mainShade,
		bottomShades,
	};
}

function ShadeSwatch({ shade }: { shade: BrandColorScaleEntry }) {
	const textColor = useMemo(
		() => getAccessibleTextColor(shade.hex),
		[shade.hex]
	);
	const [isHovered, setIsHovered] = useState(false);
	const handleCopy = useCallback(() => {
		copyHexToClipboard(shade.hex);
	}, [shade.hex]);
	const handlePointerEnter = useCallback(() => {
		setIsHovered(true);
	}, []);
	const handlePointerLeave = useCallback(() => {
		setIsHovered(false);
	}, []);

	return (
		<button
			aria-label={`Copy ${shade.hex} for shade ${shade.stop}`}
			className={cn(
				"f relative flex h-12 w-full cursor-pointer items-center justify-end px-5 text-right font-semibold text-xs uppercase tracking-wide transition-transform focus-visible:outline-none"
			)}
			onBlur={handlePointerLeave}
			onClick={handleCopy}
			onFocus={handlePointerEnter}
			onMouseEnter={handlePointerEnter}
			onMouseLeave={handlePointerLeave}
			style={{
				backgroundColor: shade.hex,
				color: textColor,
			}}
			type="button"
		>
			<span
				className={cn(
					"transition-opacity",
					isHovered ? "opacity-0" : "opacity-50"
				)}
			>
				{shade.stop}
			</span>
			<span
				className={cn(
					"pointer-events-none absolute right-5 font-mono text-xs transition-opacity",
					isHovered ? "opacity-50" : "opacity-0"
				)}
			>
				{shade.hex}
			</span>
		</button>
	);
}

type MainShadeSwatchProps = {
	color: PaletteColorWithScale;
	shade: BrandColorScaleEntry;
};

function MainShadeSwatch({ color, shade }: MainShadeSwatchProps) {
	const { replace } = useBrandText();
	const [open, setOpen] = useState(false);
	const textColor = useMemo(
		() => getAccessibleTextColor(shade.hex),
		[shade.hex]
	);
	const role = replace(color.role);
	const name = replace(color.name);
	const summary = replace(color.summary);
	const usage = replace(color.usage);

	const handleCopy = useCallback(() => {
		copyHexToClipboard(shade.hex);
	}, [shade.hex]);

	const handlePointerEnter = useCallback(() => {
		setOpen(true);
	}, []);

	const handlePointerLeave = useCallback(() => {
		setOpen(false);
	}, []);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<button
					aria-label={`Copy ${shade.hex} for ${name}`}
					className={cn(
						"f relative flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12 text-center transition-transform focus-visible:outline-none"
					)}
					onClick={handleCopy}
					// onFocus={handlePointerEnter}
					onMouseEnter={handlePointerEnter}
					onMouseLeave={handlePointerLeave}
					style={{
						backgroundColor: shade.hex,
						color: textColor,
					}}
					type="button"
				>
					<div className="pointer-events-none absolute top-6 right-5 text-right font-semibold text-xs uppercase tracking-wide opacity-50">
						{open ? (
							<span className="pointer-events-none right-5 block text-xs transition-opacity">
								{shade.stop}
							</span>
						) : (
							<span className="pointer-events-none top-0 right-5 block font-mono text-xs transition-opacity">
								{shade.hex}
							</span>
						)}
					</div>
					<span className="font-medium text-xs uppercase tracking-[0.3em] opacity-80">
						{role}
					</span>
					<span className="font-semibold text-2xl leading-tight">{name}</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="center"
				className="w-80 space-y-4 text-left text-sm"
				onMouseEnter={handlePointerEnter}
				onMouseLeave={handlePointerLeave}
			>
				<div className="space-y-1">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Role
					</p>
					<p className="font-semibold text-base text-gray-900">{role}</p>
				</div>
				<div className="space-y-1">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Summary
					</p>
					<p className="text-gray-700">{summary}</p>
				</div>
				<div className="space-y-1">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Usage
					</p>
					<p className="text-gray-700">{usage}</p>
				</div>
				<div className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 font-mono text-gray-700 text-xs">
					<span>Hex</span>
					<span>{shade.hex}</span>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function copyHexToClipboard(hex: string): void {
	if (typeof navigator === "undefined" || !navigator.clipboard) {
		return;
	}
	navigator.clipboard
		.writeText(hex)
		.then(() => toast.success(`Hex code ${hex} copied to clipboard.`));
}

function getAccessibleTextColor(hex: string): string {
	const normalized = hex.replace("#", "");
	const r = Number.parseInt(normalized.slice(0, HEX_CHANNEL_LENGTH), HEX_RADIX);
	const g = Number.parseInt(
		normalized.slice(HEX_CHANNEL_GREEN_OFFSET, HEX_CHANNEL_BLUE_OFFSET),
		HEX_RADIX
	);
	const b = Number.parseInt(
		normalized.slice(
			HEX_CHANNEL_BLUE_OFFSET,
			HEX_CHANNEL_BLUE_OFFSET + HEX_CHANNEL_LENGTH
		),
		HEX_RADIX
	);

	const luminance =
		(LUMINANCE_RED_WEIGHT * r +
			LUMINANCE_GREEN_WEIGHT * g +
			LUMINANCE_BLUE_WEIGHT * b) /
		RGB_COMPONENT_MAX;
	return luminance > LUMINANCE_THRESHOLD ? DARK_TEXT_HEX : LIGHT_TEXT_HEX;
}
