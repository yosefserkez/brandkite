import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

const mockupModules = [
	{
		name: "Name",
		description: "A name for your company.",
	},
	{
		name: "Logo",
		description: "A logo for your company.",
	},
	{
		name: "Mission",
		description: "A mission for your company.",
	},
	{
		name: "Tagline",
		description: "A tagline for your company.",
	},
	{
		name: "Story",
		description: "A story for your company.",
	},
	{
		name: "Colors",
		description: "A color palette for your company.",
	},
	{
		name: "Tone",
		description: "A tone for your company.",
	},
	{
		name: "Typography",
		description: "Typography choices for your company.",
	},
];

const firstRow = mockupModules.slice(0, mockupModules.length / 2);

type ModuleCardProps = {
	name: string;
	description: string;
	image: string;
};

const ModuleCard = ({ name, description, image }: ModuleCardProps) => {
	return (
		<figure
			className={cn(
				"relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
				// light styles
				"border-gray-950/10 bg-gray-950/1 hover:bg-gray-950/5",
				// dark styles
				"dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15"
			)}
		>
			<div className="flex flex-row items-center gap-2">
				<div className="flex flex-col">
					<figcaption className="font-medium text-sm dark:text-white">
						{name}
					</figcaption>
					<p className="font-medium text-xs dark:text-white/40">
						{description}
					</p>
				</div>
			</div>
		</figure>
	);
};

export function ModulesMarquee() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
			<Marquee className="[--duration:20s]" pauseOnHover>
				{firstRow.map((module) => (
					<ModuleCard key={module.name} {...module} />
				))}
			</Marquee>

			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/8 bg-gradient-to-r from-white" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l to-white" />
		</div>
	);
}
