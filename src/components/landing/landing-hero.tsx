import { HeroArtifacts } from "./hero-artifacts";
import { TryItInput } from "./try-it-input";

type LandingHeroProps = {
	onGenerate: (value: string) => void;
};

export function LandingHero({ onGenerate }: LandingHeroProps) {
	return (
		<section className="relative overflow-hidden">
			{/* Studio sky: soft vertical wash fading to white, warmed by two glows */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<div className="absolute inset-0 bg-[linear-gradient(180deg,var(--landing-sky),white_82%)]" />
				<div
					className="-translate-x-1/2 -top-24 absolute left-1/2 h-[620px] w-[1040px] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, color-mix(in srgb, var(--landing-sage) 80%, transparent), transparent 70%)",
					}}
				/>
				<div
					className="-translate-x-1/2 absolute top-6 left-[28%] h-[440px] w-[640px] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, color-mix(in srgb, var(--landing-cream) 75%, transparent), transparent 70%)",
					}}
				/>
			</div>

			<HeroArtifacts />

			<div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16">
				<h1 className="animate-landing-rise text-balance font-semibold text-5xl text-gray-950 leading-[1.03] tracking-tight motion-reduce:animate-none md:text-7xl">
					One idea in.
					<br className="hidden sm:block" />A whole brand out.
				</h1>
				<p
					className="max-w-lg animate-landing-rise text-balance text-gray-500 text-lg leading-relaxed motion-reduce:animate-none md:text-xl"
					style={{ animationDelay: "100ms" }}
				>
					Name, story, colors, logo, and marketing. Generated together, always
					consistent.
				</p>
				<div
					className="mt-2 flex w-full max-w-xl animate-landing-rise flex-col items-center gap-2.5 motion-reduce:animate-none"
					style={{ animationDelay: "180ms" }}
				>
					<TryItInput onSubmit={onGenerate} />
					<span className="text-gray-400 text-xs">
						Free to start &middot; your full kit in minutes
					</span>
				</div>
			</div>
		</section>
	);
}
