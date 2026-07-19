import { useMemo } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandTone } from "../../../convex/modules/tone";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type ToneModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function ToneModule({ companyId, className }: ToneModuleProps) {
	const ctx = useBrandModule(companyId, "tone");
	const { replace } = useBrandText();
	const tone = ctx.selected?.data as BrandTone | undefined;

	const onCopy = () => {
		if (!tone) {
			return;
		}
		const summary = replace(tone.summary);
		const examples = tone.examples
			.map((example, index) => {
				const number = String(index + 1).padStart(2, "0");
				return [
					`${number} — ${replace(example.title)}`,
					`Scenario: ${replace(example.context)}`,
					replace(example.description),
				].join("\n");
			})
			.join("\n\n");

		navigator.clipboard.writeText([summary, "", examples].join("\n"));
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Tone of voice" />}
		>
			{tone && <ToneContent tone={tone} />}
		</BlockWrapper>
	);
}

function ToneContent({ tone }: { tone: BrandTone }) {
	const EXAMPLES_TO_SHOW = 3;
	const normalizedExamples = useMemo(
		() => (tone.examples ?? []).slice(0, EXAMPLES_TO_SHOW),
		[tone.examples]
	);

	return (
		<Card className="h-full">
			<CardHeader className="space-y-4">
				<div className="space-y-2">
					<p className="wrap-break-word col-span-full place-self-stretch font-medium text-[11px] text-gray-400 uppercase tracking-[0.08em]">
						Tone of Voice
					</p>
					<BrandText
						as="p"
						className="wrap-break-word text-gray-950 text-sm tracking-tight"
					>
						{tone.summary}
					</BrandText>
				</div>
			</CardHeader>
			<CardContent className="mt-2 space-y-4">
				{normalizedExamples.map((example, index) => (
					<ToneExampleRow
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
}: {
	example: BrandTone["examples"][number];
	index: number;
}) {
	const number = String(index + 1).padStart(2, "0");
	return (
		<div className="flex flex-col">
			<div className="flex items-center gap-2 align-center">
				<span className="font-medium text-gray-400 text-lg">{number}</span>
				<BrandText as="p" className="text-gray-600 text-sm tracking-tight">
					{example.context}
				</BrandText>
			</div>
			<div className="flex-1 space-y-2">
				<BrandText
					as={CardTitle}
					className="wrap-break-word text-gray-950 text-sm tracking-tight"
				>
					{example.title}
				</BrandText>
				<BrandText
					as="p"
					className="wrap-break-word text-gray-950 text-sm tracking-tight"
				>
					{example.description}
				</BrandText>
			</div>
		</div>
	);
}
