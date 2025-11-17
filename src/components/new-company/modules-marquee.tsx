import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

const modules = [
	{
		name: "Name/Domain",
		image: "/name-preview.png",
	},
	{
		name: "Logo",
		image: "/logo-preview.png",
	},
	{
		name: "Mission",
		image: "/mission-preview.png",
	},
	{
		name: "Story",
		image: "/story-preview.png",
	},
	{
		name: "Design",
		image: "/design-preview.png",
	},
];

type ModuleCardProps = {
	name: string;
	image: string;
};

const ModuleCard = ({ name, image }: ModuleCardProps) => {
	return (
		<figure
			className={cn(
				"relative h-full w-48 cursor-pointer overflow-hidden rounded-xl border",
				// light styles
				"border-gray-950/10 bg-gray-950/1 hover:bg-gray-950/5",
				// dark styles
				"dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15"
			)}
		>
			<img
				alt={`${name} preview`}
				className="h-full w-full object-cover"
				height={216}
				src={image}
				width={384}
			/>
			<figcaption className="absolute top-2 left-2 rounded-sm bg-white/80 px-2 font-medium text-gray-700 text-xs dark:bg-gray-900/70 dark:text-white">
				{name}
			</figcaption>
		</figure>
	);
};
const features = [
	"Company name",
	"Domain suggestions",
	"Logo generation",
	"Brand colors",
	"Tagline & mission",
	"Brand story",
	"Typography & tone",
	"And more",
];
export function ModulesMarquee() {
	return (
		<div className="relative flex w-full max-w-4xl flex-col items-center justify-center overflow-hidden">
			<Marquee className="[--duration:40s]" pauseOnHover>
				{modules.map((module) => (
					<ModuleCard key={module.name} {...module} />
				))}
			</Marquee>

			<Marquee className="text-xs [--duration:40s]" reverse>
				{features.map((feature) => (
					<>
						<span className="text-gray-700" key={feature}>
							{feature}
						</span>
						<span className="text-gray-400">•</span>
					</>
				))}
			</Marquee>

			<div className="pointer-events-none absolute inset-y-0 left-0 w-[80px] bg-gradient-to-r from-white" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-[80px] bg-gradient-to-l from-white" />
		</div>
	);
}
