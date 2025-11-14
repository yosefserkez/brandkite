import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInFormEmailLink() {
	const [step, setStep] = useState<"signIn" | "linkSent">("signIn");

	return (
		<div className="mx-auto flex w-full flex-col gap-4">
			{step === "signIn" ? (
				<SignInWithMagicLink handleLinkSent={() => setStep("linkSent")} />
			) : (
				<div className="flex flex-col gap-1 rounded-md border border-gray-200 bg-white/80 p-3 text-black">
					<h2 className="font-semibold text-2xl tracking-tight">
						Check your email
					</h2>
					<p>A sign-in link has been sent to your email address.</p>
					<Button
						className="self-start p-0"
						onClick={() => setStep("signIn")}
						variant="link"
					>
						Change email
					</Button>
				</div>
			)}
		</div>
	);
}

function SignInWithMagicLink({
	handleLinkSent,
}: {
	handleLinkSent: () => void;
}) {
	const { signIn } = useAuthActions();
	const [submitting, setSubmitting] = useState(false);
	return (
		<form
			className="flex flex-col"
			onSubmit={(event) => {
				event.preventDefault();
				setSubmitting(true);
				const formData = new FormData(event.currentTarget);
				signIn("resend", formData)
					.then(handleLinkSent)
					.catch((_error) => {
						toast.error("Could not send sign-in link");
						setSubmitting(false);
					});
			}}
		>
			<label className="sr-only" htmlFor="email">
				Email
			</label>
			<Input
				autoComplete="email"
				className="mb-4 border-black bg-gray-50"
				id="email"
				name="email"
				placeholder="Email"
			/>
			<Button disabled={submitting} type="submit">
				Send sign-in link
			</Button>
		</form>
	);
}
