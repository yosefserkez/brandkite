import { useMemo } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTone } from "../../../convex/modules/tone";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandName } from "../../hooks/useCompanyBrand";
import { replaceCompanyName } from "../../lib/utils";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type ToneModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function ToneModule({ companyId, className }: ToneModuleProps) {
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
		<SuspenseCard headerText="Tone of voice" />
	);

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Tone of voice" />}
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
		<Card className="h-full">
			<CardHeader className="space-y-4">
				<div className="space-y-2">
					<p className="font-medium text-gray-500 text-xs uppercase tracking-wide">
						Tone of voice
					</p>
					<p className="space-y-2 text-gray-700 text-sm">
						{replaceCompanyName(tone.summary, companyName)}
					</p>
				</div>
			</CardHeader>
			<CardContent className="mt-2 space-y-4">
				{normalizedExamples.map((example, index) => (
					<ToneExampleRow
						companyName={companyName}
						example={example}
						index={index}
						key={`${example.title}-${index}`}
					/>
				))}
			</CardContent>
		</Card>
	);
}

function ToneExampleRow({
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
		<div className="flex flex-col">
			<div className="flex items-center gap-2 align-center">
				<span className="font-medium text-gray-400 text-lg">{number}</span>
				<p className="font-medium text-gray-400 text-sm">
					{replaceCompanyName(example.context, companyName)}
				</p>
			</div>
			<div className="flex-1 space-y-2">
				<CardTitle className="text-gray-700 text-lg">
					{replaceCompanyName(example.title, companyName)}
				</CardTitle>
				<p className="text-gray-500 text-sm leading-relaxed">
					{replaceCompanyName(example.description, companyName)}
				</p>
			</div>
		</div>
	);
}
