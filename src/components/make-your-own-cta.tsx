import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type MakeYourOwnCtaProps = {
	surface: "public_kit_cta" | "gallery_cta";
	className?: string;
};

export function MakeYourOwnCta({ surface, className }: MakeYourOwnCtaProps) {
	return (
		<div
			className={`flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-5 sm:flex-row ${className ?? ""}`}
		>
			<p className="text-center text-gray-700 text-sm sm:text-left">
				<span className="font-semibold text-gray-900">Made with Brandkite</span>{" "}
				— create your own complete brand kit in minutes.
			</p>
			<Button asChild onClick={() => track("share_clicked", { surface })}>
				<Link to="/">Create your brand kit</Link>
			</Button>
		</div>
	);
}
