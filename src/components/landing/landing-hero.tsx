import { TryItInput } from "./try-it-input";

type LandingHeroProps = {
	onGenerate: (value: string) => void;
};

export function LandingHero({ onGenerate }: LandingHeroProps) {
	return (
		<section className="relative overflow-hidden">
			{/* Soft, natural ambient wash — calm, not busy */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				<div
					className="-translate-x-1/2 -top-24 absolute left-1/2 h-[620px] w-[1040px] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, rgba(188,219,197,0.8), rgba(188,219,197,0) 70%)",
					}}
				/>
				<div
					className="-translate-x-1/2 absolute top-6 left-[28%] h-[440px] w-[640px] rounded-full blur-3xl"
					style={{
						background:
							"radial-gradient(closest-side, rgba(246,231,203,0.75), rgba(246,231,203,0) 70%)",
					}}
				/>
			</div>
			<div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-16 pb-10 text-center md:pt-24 md:pb-12">
				<h1 className="text-balance font-semibold text-5xl text-gray-950 leading-[1.03] tracking-tight md:text-7xl">
					One idea in.
					<br className="hidden sm:block" />A whole brand out.
				</h1>
				<p className="max-w-lg text-balance text-gray-500 text-lg leading-relaxed md:text-xl">
					Name, story, colors, logo, and marketing — generated together, always
					consistent.
				</p>
				<div className="mt-2 flex w-full max-w-xl flex-col items-center gap-2.5">
					<TryItInput onSubmit={onGenerate} />
					<span className="text-gray-400 text-xs">
						Free to start &middot; your full kit in minutes
					</span>
				</div>
			</div>
		</section>
	);
}
