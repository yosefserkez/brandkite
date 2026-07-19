import { useMutation, useQuery } from "convex/react";
import { Check, Copy, ExternalLink, Globe, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { track } from "../lib/analytics";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const COPIED_RESET_MS = 1500;
const PROTOCOL_RE = /^https?:\/\//;

// Clipboard writes can reject (e.g. document not focused); it's a nicety, so
// swallow the failure.
const ignoreClipboardError = () => {
	// no-op
};

export function PublishSiteButton({
	companyId,
}: {
	companyId: Id<"companies">;
}) {
	const status = useQuery(api.site.getSiteStatus, { companyId });
	const publishSite = useMutation(api.site.publishSite);
	const unpublishSite = useMutation(api.site.unpublishSite);
	const setSiteSlug = useMutation(api.site.setSiteSlug);
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState(false);
	const [editing, setEditing] = useState(false);
	const [slugDraft, setSlugDraft] = useState("");

	const origin = typeof window === "undefined" ? "" : window.location.origin;
	const url = status?.slug ? `${origin}/s/${status.slug}` : null;
	const previewUrl = `${origin}/s/preview/${companyId}`;

	const handlePublish = async () => {
		setBusy(true);
		try {
			const slug = await publishSite({ companyId });
			track("kit_published", { company_id: companyId, surface: "site" });
			toast.success("Site published");
			await navigator.clipboard
				.writeText(`${origin}/s/${slug}`)
				.catch(ignoreClipboardError);
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

	const handleSaveSlug = async () => {
		setBusy(true);
		try {
			const saved = await setSiteSlug({ companyId, slug: slugDraft });
			toast.success("URL updated");
			await navigator.clipboard.writeText(`${origin}/s/${saved}`).catch(ignoreClipboardError);
			setEditing(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Couldn't update URL"
			);
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
			setTimeout(() => setCopied(false), COPIED_RESET_MS);
		});
	};

	const startEditing = () => {
		setSlugDraft(status?.slug ?? "");
		setEditing(true);
	};

	if (status?.published && url) {
		return (
			<Popover onOpenChange={(open) => !open && setEditing(false)}>
				<PopoverTrigger asChild>
					<Button size="sm" variant="outline">
						<Globe className="h-3.5 w-3.5 text-green-600" />
						<span>Site live</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-80 space-y-3">
					{editing ? (
						<div className="space-y-2">
							<label
								className="font-medium text-sm"
								htmlFor="site-slug-input"
							>
								Custom URL
							</label>
							<div className="flex items-center gap-1 rounded-md border px-2 focus-within:ring-1 focus-within:ring-gray-400">
								<span className="shrink-0 text-gray-400 text-xs">/s/</span>
								<Input
									autoComplete="off"
									className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
									id="site-slug-input"
									onChange={(e) => setSlugDraft(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSaveSlug();
										}
									}}
									spellCheck={false}
									value={slugDraft}
								/>
							</div>
							<div className="flex gap-2">
								<Button
									className="flex-1"
									disabled={busy}
									onClick={handleSaveSlug}
									size="sm"
								>
									Save URL
								</Button>
								<Button
									onClick={() => setEditing(false)}
									size="sm"
									variant="ghost"
								>
									Cancel
								</Button>
							</div>
						</div>
					) : (
						<>
							<div>
								<p className="font-medium text-sm">Your site is live</p>
								<div className="mt-1 flex items-center gap-1.5">
									<a
										className="block truncate text-gray-500 text-xs hover:text-gray-900 hover:underline"
										href={url}
										rel="noreferrer"
										target="_blank"
									>
										{url.replace(PROTOCOL_RE, "")}
									</a>
									<button
										aria-label="Edit URL"
										className="shrink-0 text-gray-400 hover:text-gray-700"
										onClick={startEditing}
										type="button"
									>
										<Pencil className="h-3 w-3" />
									</button>
								</div>
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
						</>
					)}
				</PopoverContent>
			</Popover>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Button asChild size="sm" variant="ghost">
				<a href={previewUrl} rel="noreferrer" target="_blank">
					<ExternalLink className="h-3.5 w-3.5" />
					Preview
				</a>
			</Button>
			<Button disabled={busy} onClick={handlePublish} size="sm">
				<Globe className="h-3.5 w-3.5" />
				<span>Publish site</span>
			</Button>
		</div>
	);
}
