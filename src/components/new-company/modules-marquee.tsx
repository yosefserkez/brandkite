import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

const mockupModules = [
	{
		name: "Team",
		description: "A team of people who work together to achieve a common goal.",
		image: "https://avatar.vercel.sh/team",
	},
	{
		name: "Customer",
		description: "A customer who buys a product or service.",
		image: "https://avatar.vercel.sh/customer",
	},
	{
		name: "Product",
		description: "A product that is sold to a customer.",
		image: "https://avatar.vercel.sh/product",
	},
	{
		name: "Market",
		description: "A market that is served by a product or service.",
		image: "https://avatar.vercel.sh/market",
	},
	{
		name: "Business",
		description: "A business that is in the market.",
		image: "https://avatar.vercel.sh/business",
	},
	{
		name: "Brand",
		description: "A brand that is in the market.",
		image: "https://avatar.vercel.sh/brand",
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
				<img
					alt=""
					className="rounded-full"
					height="32"
					src={image}
					width="32"
				/>
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

			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-gray-50" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-gray-50" />
		</div>
	);
}
