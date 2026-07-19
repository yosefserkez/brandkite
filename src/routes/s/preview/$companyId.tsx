import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PublishedSite } from "@/components/site/published-site";

// Private, owner-only preview of a brand's site before (or without) publishing.
// Not SSR'd and marked noindex — it depends on the viewer's auth.
export const Route = createFileRoute("/s/preview/$companyId")({
	component: SitePreviewRoute,
	head: () => ({
		meta: [{ title: "Site preview" }, { name: "robots", content: "noindex" }],
	}),
});

function SitePreviewRoute() {
	const { companyId } = Route.useParams();
	const data = useQuery(api.site.getSitePreview, {
		companyId: companyId as Id<"companies">,
	});

	if (data === undefined) {
		return (
			<output className="flex min-h-screen items-center justify-center bg-white">
				<span
					aria-hidden="true"
					className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
				/>
				<span className="sr-only">Loading preview</span>
			</output>
		);
	}

	if (data === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white px-6">
				<div className="text-center">
					<p className="font-semibold text-gray-900 text-lg">
						Preview unavailable
					</p>
					<p className="mt-2 text-gray-500 text-sm">
						This preview is only visible to the brand's owner while signed in.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-gray-900 px-4 py-2 text-center font-medium text-white text-xs">
				<span
					aria-hidden="true"
					className="h-1.5 w-1.5 rounded-full bg-amber-400"
				/>
				Preview — this site isn't published yet. Only you can see it.
			</div>
			<PublishedSite data={data} />
		</>
	);
}
