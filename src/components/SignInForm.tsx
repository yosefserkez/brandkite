"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
	const { signIn } = useAuthActions();
	const posthog = usePostHog();
	const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
	const [submitting, setSubmitting] = useState(false);

	return (
		<div className="w-full">
			<form
				className="flex flex-col gap-form-field"
				onSubmit={(e) => {
					e.preventDefault();
					setSubmitting(true);
					const formData = new FormData(e.target as HTMLFormElement);
					formData.set("flow", flow);
					void signIn("password", formData)
						.then(() => {
							posthog.capture(
								flow === "signIn" ? "user_signed_in" : "user_signed_up"
							);
						})
						.catch((error) => {
							let toastTitle = "";
							if (error.message.includes("Invalid password")) {
								toastTitle = "Invalid password. Please try again.";
							} else {
								toastTitle =
									flow === "signIn"
										? "Could not sign in, did you mean to sign up?"
										: "Could not sign up, did you mean to sign in?";
							}
							toast.error(toastTitle);
							setSubmitting(false);
						});
				}}
			>
				<input
					className="auth-input-field"
					name="email"
					placeholder="Email"
					required
					type="email"
				/>
				<input
					className="auth-input-field"
					name="password"
					placeholder="Password"
					required
					type="password"
				/>
				<button className="auth-button" disabled={submitting} type="submit">
					{flow === "signIn" ? "Sign in" : "Sign up"}
				</button>
				<div className="text-center text-secondary text-sm">
					<span>
						{flow === "signIn"
							? "Don't have an account? "
							: "Already have an account? "}
					</span>
					<button
						className="cursor-pointer font-medium text-primary hover:text-primary-hover hover:underline"
						onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
						type="button"
					>
						{flow === "signIn" ? "Sign up instead" : "Sign in instead"}
					</button>
				</div>
			</form>
			<div className="my-3 flex items-center justify-center">
				<hr className="my-4 grow border-gray-200" />
				<span className="mx-4 text-secondary">or</span>
				<hr className="my-4 grow border-gray-200" />
			</div>
			<button
				className="auth-button"
				onClick={() => {
					signIn("anonymous")
						.then(() => {
							posthog.capture("user_signed_in_anonymously");
						})
						.catch(() => {
							toast.error("Could not sign in anonymously.");
						});
				}}
				type="button"
			>
				Sign in anonymously
			</button>
		</div>
	);
}
