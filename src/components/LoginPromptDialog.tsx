import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type LoginPromptDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
};

export function LoginPromptDialog({
	open,
	onOpenChange,
	title = "Sign in required",
	description = "Please sign in to continue with this action.",
}: LoginPromptDialogProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="mt-4">
					<SignInFormEmailLink />
				</div>
			</DialogContent>
		</Dialog>
	);
}
