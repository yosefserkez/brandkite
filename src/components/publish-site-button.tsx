import { useMutation, useQuery } from "convex/react";
import { Check, Copy, ExternalLink, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { track } from "../lib/analytics";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function PublishSiteButton({
	companyId,
}: {
	companyId: Id<"companies">;
}) {
	const status = useQuery(api.site.getSiteStatus, { companyId });
	const publishSite = useMutation(api.site.publishSite);
	const unpublishSite = useMutation(api.site.unpublishSite);
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState(false);

	const origin = typeof window === "undefined" ? "" : window.location.origin;
	const url = status?.slug ? `${origin}/s/${status.slug}` : null;

	const handlePublish = async () => {
		setBusy(true);
		try {
			const slug = await publishSite({ companyId });
			track("kit_published", { company_id: companyId, surface: "site" });
			toast.success("Site published");
			await navigator.clipboard
				.writeText(`${origin}/s/${slug}`)
				.catch(() => {});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to publish");
		} finally {
			setBusy(false);
		}
	};

	const handleUnpublish = async () => {
		setBusy(true);
		try {
			await unpublishSite({ companyId });
			toast.success("Site unpublished");
		} finally {
			setBusy(false);
		}
	};

	const copyLink = () => {
		if (!url) {
			return;
		}
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};

	if (status?.published && url) {
		return (
			<Popover>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline">
						<Globe className="h-3.5 w-3.5 text-green-600" />
						<span>Site live</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-80 space-y-3">
					<div>
						<p className="font-medium text-sm">Your site is live</p>
						<a
							className="mt-1 block truncate text-gray-500 text-xs hover:text-gray-900 hover:underline"
							href={url}
							rel="noreferrer"
							target="_blank"
						>
							{url.replace(/^https?:\/\//, "")}
						</a>
					</div>
					<div className="flex gap-2">
						<Button
							className="flex-1"
							onClick={copyLink}
							size="sm"
							variant="outline"
						>
							{copied ? (
								<Check className="h-3.5 w-3.5" />
							) : (
								<Copy className="h-3.5 w-3.5" />
							)}
							Copy
						</Button>
						<Button asChild className="flex-1" size="sm" variant="outline">
							<a href={url} rel="noreferrer" target="_blank">
								<ExternalLink className="h-3.5 w-3.5" />
								Visit
							</a>
						</Button>
					</div>
					<button
						className="text-gray-400 text-xs hover:text-gray-700"
						disabled={busy}
						onClick={handleUnpublish}
						type="button"
					>
						Unpublish
					</button>
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<Button disabled={busy} onClick={handlePublish} size="sm">
			<Globe className="h-3.5 w-3.5" />
			<span>Publish site</span>
		</Button>
	);
}
