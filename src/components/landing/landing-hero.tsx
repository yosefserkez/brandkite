import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { Button } from "@/components/ui/button";

export function LandingHero() {
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);

	return (
		<>
			<section className="relative overflow-hidden bg-white">
				<div className="mx-auto flex max-w-3xl flex-col items-center gap-7 px-4 pt-20 pb-14 text-center md:pt-28 md:pb-20">
					<h1 className="text-balance font-semibold text-5xl text-gray-950 leading-[1.05] tracking-tight md:text-7xl">
						One idea in.
						<br className="hidden sm:block" />A whole brand out.
					</h1>
					<p className="max-w-lg text-balance text-gray-500 text-lg leading-relaxed md:text-xl">
						Name, story, colors, logo, and marketing — generated together,
						always consistent.
					</p>
					<div className="mt-1 flex flex-col items-center gap-3">
						<Button
							onClick={() => setLoginDialogOpen(true)}
							size="lg"
							type="button"
						>
							<IconSparkles className="size-4" />
							Create your brand kit
							<IconArrowRight className="size-4" />
						</Button>
						<span className="text-gray-400 text-xs">
							Free to start &middot; full kit in minutes
						</span>
					</div>
				</div>
			</section>
			<LoginPromptDialog
				description="Sign in to start building your brand identity with AI-powered tools."
				onOpenChange={setLoginDialogOpen}
				open={loginDialogOpen}
				title="Get started with Brandkite"
			/>
		</>
	);
}
