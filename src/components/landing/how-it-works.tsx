import { IconEdit, IconLink, IconWand } from "@tabler/icons-react";
import type { ComponentType } from "react";

type Step = {
	icon: ComponentType<{ className?: string }>;
	title: string;
	description: string;
};

const steps: Step[] = [
	{
		icon: IconLink,
		title: "Paste a URL or an idea",
		description:
			"Drop in your website, or just describe your business in a sentence.",
	},
	{
		icon: IconWand,
		title: "AI generates your full kit",
		description:
			"Name, tagline, mission, story, tone, colors, typography, and logo — 25+ modules, ready together.",
	},
	{
		icon: IconEdit,
		title: "Edit, publish, and share",
		description:
			"Refine anything, then share a live link or hand off a client-ready kit.",
	},
];

export function HowItWorks() {
	return (
		<section className="mx-auto max-w-4xl px-4 pb-8">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
				{steps.map((step, index) => (
					<div
						className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center"
						key={step.title}
					>
						<div className="flex size-9 items-center justify-center rounded-full bg-brand-primary-50 text-brand-primary-700">
							<step.icon className="size-4.5" />
						</div>
						<h3 className="font-semibold text-gray-900 text-sm">
							{index + 1}. {step.title}
						</h3>
						<p className="text-gray-600 text-xs">{step.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
