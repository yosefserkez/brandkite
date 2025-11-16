import { SignInFormEmailLink } from "@/components/signInWithMagicLink";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
import { WarpBackground } from "@/components/ui/warp-background";
import { cn } from "@/lib/utils";

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
			<DialogPortal data-slot="dialog-portal">
				<DialogOverlay className={cn("bg-white/50 backdrop-blur-sm")} />
				<DialogContent
					className={cn(
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg"
					)}
					data-slot="dialog-content"
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<WarpBackground className="px-10">
						<SignInFormEmailLink />
					</WarpBackground>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
}
