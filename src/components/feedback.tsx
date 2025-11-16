import { useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ShineBorder } from "./ui/shine-border";

type FeedbackFormValues = {
	message: string;
	email?: string;
};

type FeedbackProps = {
	onSubmit?: (values: FeedbackFormValues) => Promise<void> | void;
	className?: string;
};

export function Feedback({ onSubmit, className }: FeedbackProps) {
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const viewer = useQuery(api.users.viewer);
	const viewerEmail = viewer?.email ?? "";

	const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
		if (!message.trim()) {
			return;
		}
		setSubmitting(true);
		// Fire-and-forget optional callback; do not prevent default submit.
		try {
			onSubmit?.({
				message: message.trim(),
				email: viewerEmail || undefined,
			});
			toast.success("Thanks for your feedback!");
			// Defer clearing so the native submit still posts the current values
			setTimeout(() => {
				setMessage("");
			}, 0);
		} catch {
			// If onSubmit throws synchronously
			toast.error("Something went wrong. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (!viewerEmail) {
		return null;
	}
	return (
		<form
			accept-charset="UTF-8"
			action="/"
			className={className}
			data-netlify="true"
			data-netlify-honeypot="bot-field"
			method="POST"
			name="feedback-form"
		>
			{/* Netlify form requirements */}
			<input name="form-name" type="hidden" value="feedback-form" />
			<input name="bot-field" type="hidden" />
			<input name="email" type="hidden" value={viewerEmail} />
			<Card className="relative space-y-3 rounded-lg border bg-gray-50">
				<CardHeader>
					<h2 className="font-semibold text-base">
						What features/modules would you like to see next?
					</h2>
				</CardHeader>
				<CardContent>
					<div className="space-y-1">
						<label className="text-gray-600 text-xs" htmlFor="feedback-message">
							Your feedback
						</label>
						<textarea
							className="field-sizing-content w-full resize-none rounded-md px-3 py-2 hover:bg-accent"
							id="feedback-message"
							name="message"
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Share ideas, pain points, or modules you want..."
							required={true}
							rows={4}
							value={message}
						/>
					</div>
				</CardContent>

				<CardFooter>
					<div className="flex items-center justify-end">
						<Button
							disabled={submitting || !message.trim()}
							onClick={handleClick}
							type="submit"
						>
							{submitting ? "Sending..." : "Send feedback"}
						</Button>
					</div>
				</CardFooter>
				<ShineBorder shineColor="black" />
			</Card>
		</form>
	);
}
