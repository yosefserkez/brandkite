import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { Button } from "@/components/ui/button";

export function LandingHero() {
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);

	return (
		<>
			<section className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 pt-10 pb-6 text-center md:pt-16 md:pb-8">
				<span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary-200 bg-brand-primary-50 px-3 py-1 font-medium text-brand-primary-700 text-xs">
					<IconSparkles className="size-3.5" />
					AI-powered brand studio
				</span>
				<h1 className="text-balance font-semibold text-3xl text-gray-900 tracking-tight md:text-5xl">
					A complete, client-ready brand identity in minutes.
				</h1>
				<p className="text-balance text-base text-gray-600 md:text-lg">
					Paste a URL or a sentence and Brandkite generates your name, tagline,
					mission, story, tone, colors, typography, and an editable logo — a
					full, versioned brand kit, not just another logo.
				</p>
				<div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
					<Button
						onClick={() => setLoginDialogOpen(true)}
						size="lg"
						type="button"
					>
						Create Your Brand Kit
						<IconArrowRight className="size-4" />
					</Button>
					<span className="text-gray-500 text-xs">
						Free to start &middot; ready in minutes
					</span>
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
