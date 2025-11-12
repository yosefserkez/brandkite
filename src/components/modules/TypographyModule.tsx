import { useMemo } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTypography } from "../../../convex/modules/typography";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { cn, replaceCompanyName } from "../../lib/utils";
import { BlockWrapper } from "./BlockWrapper";

type TypographyModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function TypographyModule({
	companyId,
	className,
}: TypographyModuleProps) {
	const ctx = useBrandModule(companyId, "typography");
	const companyName = useCompanyBrandName(companyId);
	const data = ctx.selected?.data as BrandTypography | undefined;

	const sortedWeights = useMemo(() => {
		if (!data) {
			return [] as BrandTypography["weights"];
		}
		return [...data.weights].sort((a, b) => a.fontWeight - b.fontWeight);
	}, [data]);

	const onCopy = () => {
		if (!data) {
			return;
		}
		const safeCompanyName = companyName ?? "";
		const lines = [
			"Typography system",
			replaceCompanyName(data.overview, safeCompanyName),
			"",
			"Guidelines:",
			...data.guidelines.map(
				(line) => `- ${replaceCompanyName(line, safeCompanyName)}`
			),
			"",
			`Primary font: ${data.primaryFont.name}`,
			replaceCompanyName(data.primaryFont.summary, safeCompanyName),
			replaceCompanyName(data.primaryFont.usage, safeCompanyName),
			replaceCompanyName(data.primaryFont.pairing, safeCompanyName),
			"",
			`Headline font: ${data.headlineFont.name}`,
			replaceCompanyName(data.headlineFont.summary, safeCompanyName),
			replaceCompanyName(data.headlineFont.usage, safeCompanyName),
			replaceCompanyName(data.headlineFont.pairing, safeCompanyName),
			"",
			"Weight usage:",
			...sortedWeights.map(
				(weight) =>
					`${weight.label} (${weight.fontWeight}): ${replaceCompanyName(weight.description, safeCompanyName)}`
			),
			"",
			"Character set:",
			`Uppercase: ${data.characterSet.uppercase}`,
			`Lowercase: ${data.characterSet.lowercase}`,
			`Numerals: ${data.characterSet.numerals}`,
			`Punctuation: ${data.characterSet.punctuation}`,
			"",
			replaceCompanyName(data.specimenCopy, safeCompanyName),
		];
		navigator.clipboard.writeText(lines.join("\n"));
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<TypographySkeleton />}
		>
			{data ? (
				<div className="gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:grid lg:grid-cols-[1.2fr,0.8fr]">
					<TypographySummary companyName={companyName ?? ""} data={data} />
					<TypographySpecimen
						companyName={companyName ?? ""}
						data={data}
						sortedWeights={sortedWeights}
					/>
				</div>
			) : (
				<TypographyEmptyState />
			)}
		</BlockWrapper>
	);
}

const SKELETON_GUIDELINE_KEYS = ["guide-1", "guide-2", "guide-3"];
const SKELETON_CARD_KEYS = ["primary", "headline"];
const SKELETON_WEIGHT_KEYS = [
	"weight-1",
	"weight-2",
	"weight-3",
	"weight-4",
	"weight-5",
];
const SKELETON_SET_KEYS = ["set-1", "set-2", "set-3", "set-4"];

function TypographySummary({
	data,
	companyName,
}: {
	data: BrandTypography;
	companyName: string;
}) {
	return (
		<div className="flex flex-col gap-6">
			<header className="space-y-2">
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					Typography
				</p>
				<h2 className="font-semibold text-2xl text-gray-900">Type system</h2>
			</header>
			<p className={cn("text-gray-700", "leading-relaxed")}>
				{replaceCompanyName(data.overview, companyName)}
			</p>
			<ul
				className={cn(
					"space-y-2",
					"rounded-2xl",
					"border",
					"border-gray-100",
					"bg-gray-50",
					"p-5",
					"text-sm",
					"text-gray-700"
				)}
			>
				{data.guidelines.map((item) => (
					<li className="flex gap-2" key={item}>
						<span
							style={{
								backgroundColor: "#9CA3AF",
								borderRadius: "9999px",
								height: 6,
								marginTop: 4,
								width: 6,
							}}
						/>
						<span>{replaceCompanyName(item, companyName)}</span>
					</li>
				))}
			</ul>
			<div className="grid gap-5 lg:grid-cols-2">
				<TypographyFontCard
					companyName={companyName}
					font={data.primaryFont}
					title="Primary font"
				/>
				<TypographyFontCard
					companyName={companyName}
					font={data.headlineFont}
					title="Headline font"
				/>
			</div>
		</div>
	);
}

function TypographyFontCard({
	font,
	title,
	companyName,
}: {
	font: BrandTypography["primaryFont"];
	title: string;
	companyName: string;
}) {
	return (
		<div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
			<div>
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					{title}
				</p>
				<h3 className="font-semibold text-gray-900 text-xl">{font.name}</h3>
			</div>
			<p className={cn("text-sm", "text-gray-700", "leading-relaxed")}>
				{replaceCompanyName(font.summary, companyName)}
			</p>
			<div className={cn("space-y-2", "text-sm", "text-gray-600")}>
				<div>
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Usage
					</p>
					<p>{replaceCompanyName(font.usage, companyName)}</p>
				</div>
				<div>
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Pairing
					</p>
					<p>{replaceCompanyName(font.pairing, companyName)}</p>
				</div>
			</div>
		</div>
	);
}

function TypographySpecimen({
	data,
	companyName,
	sortedWeights,
}: {
	data: BrandTypography;
	companyName: string;
	sortedWeights: BrandTypography["weights"];
}) {
	return (
		<div className="flex h-full flex-col gap-6 rounded-3xl border border-gray-100 bg-gray-50 p-6">
			<div className="space-y-3">
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					Specimen
				</p>
				<p className="font-semibold text-2xl text-gray-900">
					{replaceCompanyName(data.specimenCopy, companyName)}
				</p>
			</div>
			<div className="space-y-3">
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					Weight scale
				</p>
				<ul className="space-y-2">
					{sortedWeights.map((weight) => (
						<li
							className="space-y-1 rounded-2xl bg-white px-5 py-3 shadow-sm"
							key={`${weight.label}-${weight.fontWeight}`}
						>
							<div className="flex items-baseline justify-between gap-4">
								<span
									className={cn("text-lg", "text-gray-900")}
									style={{ fontWeight: weight.fontWeight }}
								>
									{weight.label}
								</span>
								<span className="text-gray-400 text-xs">
									{weight.fontWeight}
								</span>
							</div>
							<p className={cn("text-xs", "text-gray-600", "leading-snug")}>
								{replaceCompanyName(weight.description, companyName)}
							</p>
						</li>
					))}
				</ul>
			</div>
			<div className="space-y-3">
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					Character set
				</p>
				<div
					className={cn(
						"space-y-2",
						"rounded-2xl",
						"bg-white",
						"p-5",
						"font-mono",
						"text-sm",
						"text-gray-700",
						"shadow-sm"
					)}
				>
					<p>{data.characterSet.uppercase}</p>
					<p>{data.characterSet.lowercase}</p>
					<p>{data.characterSet.numerals}</p>
					<p>{data.characterSet.punctuation}</p>
				</div>
			</div>
		</div>
	);
}

function TypographySkeleton() {
	return (
		<div className="gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:grid lg:grid-cols-[1.2fr,0.8fr]">
			<div className="space-y-5">
				<div className="h-4 w-24 rounded bg-gray-200" />
				<div className="h-7 w-40 rounded bg-gray-200" />
				<div className="space-y-2">
					<div className="h-3 w-full rounded bg-gray-200" />
					<div className="h-3 w-5/6 rounded bg-gray-200" />
					<div className="h-3 w-4/6 rounded bg-gray-200" />
				</div>
				<div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-5">
					{SKELETON_GUIDELINE_KEYS.map((key) => (
						<div className="h-3 w-full rounded bg-gray-200" key={key} />
					))}
				</div>
				<div className="grid gap-4 lg:grid-cols-2">
					{SKELETON_CARD_KEYS.map((key) => (
						<div
							className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-5"
							key={key}
						>
							<div className="h-4 w-24 rounded bg-gray-200" />
							<div className="h-6 w-32 rounded bg-gray-200" />
							<div className="h-3 w-5/6 rounded bg-gray-200" />
							<div className="h-3 w-4/6 rounded bg-gray-200" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
				<div className="space-y-2">
					<div className="h-3 w-24 rounded bg-gray-200" />
					<div className="h-8 w-5/6 rounded bg-gray-200" />
				</div>
				<div className="space-y-2">
					{SKELETON_WEIGHT_KEYS.map((key) => (
						<div className="h-10 rounded-2xl bg-white" key={key} />
					))}
				</div>
				<div className="space-y-2 rounded-2xl bg-white p-5">
					{SKELETON_SET_KEYS.map((key) => (
						<div className="h-3 w-full rounded bg-gray-200" key={key} />
					))}
				</div>
			</div>
		</div>
	);
}

function TypographyEmptyState() {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl border border-gray-200 border-dashed bg-gray-50 px-6 py-12 text-center">
			<p className="font-medium text-gray-600 text-sm">
				Typography is on its way
			</p>
			<p className="text-gray-500 text-sm">
				Regenerate this block once your brand context is ready to craft a
				tailored type hierarchy.
			</p>
		</div>
	);
}
