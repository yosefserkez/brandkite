import { useMemo } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTone } from "../../../convex/modules/tone";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { replaceCompanyName } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type ToneModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function ToneModule({
	companyId,
	className,
}: ToneModuleProps) {
	const ctx = useBrandModule(companyId, "tone");
	const companyName = useCompanyBrandName(companyId);
	const tone = ctx.selected?.data as BrandTone | undefined;

	const onCopy = () => {
		if (!tone) {
			return;
		}
		const summary = replaceCompanyName(tone.summary, companyName);
		const examples = tone.examples
			.map((example, index) => {
				const number = String(index + 1).padStart(2, "0");
				return [
					`${number} — ${replaceCompanyName(example.title, companyName)}`,
					`Scenario: ${replaceCompanyName(example.context, companyName)}`,
					replaceCompanyName(example.description, companyName),
				].join("\n");
			})
			.join("\n\n");

		navigator.clipboard.writeText([summary, "", examples].join("\n"));
	};

	const content = tone ? (
		<ToneContent companyName={companyName} tone={tone} />
	) : (
		<ToneSkeleton />
	);

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<ToneSkeleton />}
		>
			{content}
		</BlockWrapper>
	);
}

function ToneContent({
	tone,
	companyName,
}: {
	tone: BrandTone;
	companyName?: string | null;
}) {
	const normalizedExamples = useMemo(
		() => (tone.examples ?? []).slice(0, 3),
		[tone.examples]
	);

	return (
		<div className="grid h-full gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
			<section className="flex flex-col justify-between gap-6">
				<header className="space-y-3">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Tone of voice
					</p>
					<h2 className="font-semibold text-2xl text-gray-900">
						How {(companyName ?? "{company_name}")} speaks
					</h2>
				</header>
				<p className="text-gray-700 text-base leading-relaxed">
					{replaceCompanyName(tone.summary, companyName)}
				</p>
			</section>
			<section className="grid gap-4 lg:grid-cols-3">
				{normalizedExamples.map((example, index) => (
					<ToneExampleCard
						companyName={companyName}
						example={example}
						index={index}
						key={`${example.title}-${index}`}
					/>
				))}
			</section>
		</div>
	);
}

function ToneExampleCard({
	example,
	index,
	companyName,
}: {
	example: BrandTone["examples"][number];
	index: number;
	companyName?: string | null;
}) {
	const number = String(index + 1).padStart(2, "0");
	return (
		<Card className="flex h-full flex-col justify-between border-none bg-gray-50 shadow-none ring-1 ring-inset ring-gray-200">
			<CardHeader className="space-y-2">
				<span className="font-semibold text-gray-400 text-sm">{number}</span>
				<CardTitle className="text-gray-900 text-lg">
					{replaceCompanyName(example.title, companyName)}
				</CardTitle>
				<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
					{replaceCompanyName(example.context, companyName)}
				</p>
			</CardHeader>
			<CardContent className="text-gray-600 text-sm leading-relaxed">
				{replaceCompanyName(example.description, companyName)}
			</CardContent>
		</Card>
	);
}

function ToneSkeleton() {
	return (
		<div className="grid h-full animate-pulse gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
			<div className="flex flex-col justify-between gap-4">
				<div className="space-y-3">
					<div className="h-3 w-24 rounded bg-gray-200" />
					<div className="h-6 w-40 rounded bg-gray-200" />
				</div>
				<div className="space-y-3">
					<div className="h-3 w-full rounded bg-gray-200" />
					<div className="h-3 w-5/6 rounded bg-gray-200" />
					<div className="h-3 w-4/6 rounded bg-gray-200" />
				</div>
			</div>
			<div className="grid gap-4 lg:grid-cols-3">
				{[0, 1, 2].map((item) => (
					<div
						className="flex flex-col justify-between rounded-2xl bg-gray-50 p-5"
						key={`tone-skeleton-${item}`}
					>
						<div className="space-y-3">
							<div className="h-3 w-10 rounded bg-gray-200" />
							<div className="h-4 w-3/4 rounded bg-gray-200" />
							<div className="h-3 w-2/3 rounded bg-gray-200" />
						</div>
						<div className="space-y-2 pt-4">
							<div className="h-3 w-full rounded bg-gray-200" />
							<div className="h-3 w-5/6 rounded bg-gray-200" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

