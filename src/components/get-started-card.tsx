import { useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import { LoginPromptDialog } from "./LoginPromptDialog";
import { ModulesMarquee } from "./new-company/modules-marquee";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ShineBorder } from "./ui/shine-border";

type GetStartedCardProps = {
	className?: string;
};

export function GetStartedCard({ className }: GetStartedCardProps) {
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);
	const viewer = useQuery(api.users.viewer);

	// Only show for unauthenticated users
	if (viewer !== undefined && viewer !== null) {
		return null;
	}

	return (
		<>
			<Card
				className={cn(
					"relative space-y-3 rounded-lg border bg-gray-50 pb-2 shadow-lg",
					className
				)}
			>
				<CardHeader className="flex items-center justify-between">
					<h2 className="font-semibold text-base">
						Now yours: one description in, your whole kit out.
					</h2>
					<Button
						onClick={() => setLoginDialogOpen(true)}
						size="sm"
						type="button"
					>
						Start my kit
					</Button>
				</CardHeader>
				<CardContent className="m-0 p-0">
					<ModulesMarquee />
				</CardContent>
				<CardFooter>
					<div className="flex w-full items-center justify-end" />
				</CardFooter>
				<ShineBorder shineColor="black" />
			</Card>
			<LoginPromptDialog
				description="Sign in to generate your first kit. Free to start, no credit card."
				onOpenChange={setLoginDialogOpen}
				open={loginDialogOpen}
				title="Start your brand kit"
			/>
		</>
	);
}
