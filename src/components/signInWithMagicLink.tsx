import { useAuthActions } from "@convex-dev/auth/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInFormEmailLink() {
	const [step, setStep] = useState<"signIn" | "linkSent">("signIn");

	return (
		<div className="mx-auto flex max-w-[384px] flex-col gap-4">
			{step === "signIn" ? (
				<>
					<h2 className="font-semibold text-2xl tracking-tight">
						Sign in or create an account
					</h2>
					<SignInWithMagicLink handleLinkSent={() => setStep("linkSent")} />
				</>
			) : (
				<>
					<h2 className="font-semibold text-2xl tracking-tight">
						Check your email
					</h2>
					<p>A sign-in link has been sent to your email address.</p>
					<Button
						className="self-start p-0"
						onClick={() => setStep("signIn")}
						variant="link"
					>
						Cancel
					</Button>
				</>
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
			<label htmlFor="email">Email</label>
			<Input autoComplete="email" className="mb-4" id={useId()} name="email" />
			<Button disabled={submitting} type="submit">
				Send sign-in link
			</Button>
		</form>
	);
}
