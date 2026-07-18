import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";

export function SignInFormEmailLink() {
	const [step, setStep] = useState<"signIn" | "linkSent">("signIn");

	return (
		<div className="mx-auto flex w-full flex-col gap-4">
			{step === "signIn" ? (
				<>
					{GOOGLE_AUTH_ENABLED ? (
						<>
							<SignInWithGoogle />
							<div className="flex items-center gap-3 text-gray-400 text-xs uppercase tracking-wide">
								<div className="h-px flex-1 bg-gray-200" />
								or
								<div className="h-px flex-1 bg-gray-200" />
							</div>
						</>
					) : null}
					<SignInWithMagicLink handleLinkSent={() => setStep("linkSent")} />
				</>
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

function SignInWithGoogle() {
	const { signIn } = useAuthActions();
	const [submitting, setSubmitting] = useState(false);
	return (
		<Button
			className="flex items-center gap-2 border-black bg-white text-black hover:bg-gray-50"
			disabled={submitting}
			onClick={() => {
				setSubmitting(true);
				signIn("google").catch((_error) => {
					toast.error("Could not sign in with Google");
					setSubmitting(false);
				});
			}}
			type="button"
			variant="outline"
		>
			<svg
				aria-hidden="true"
				className="size-4"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.53-5.19 3.53-8.8z"
					fill="#4285F4"
				/>
				<path
					d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.89-2.98c-1.08.72-2.46 1.15-4.04 1.15-3.11 0-5.75-2.1-6.69-4.92H1.29v3.09C3.26 21.3 7.31 24 12 24z"
					fill="#34A853"
				/>
				<path
					d="M5.31 14.34A7.2 7.2 0 0 1 4.93 12c0-.81.14-1.6.38-2.34V6.57H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.43z"
					fill="#FBBC05"
				/>
				<path
					d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.57l4.02 3.09C6.25 6.85 8.89 4.75 12 4.75z"
					fill="#EA4335"
				/>
			</svg>
			Continue with Google
		</Button>
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
