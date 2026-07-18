import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { PublishedSite } from "@/components/site/published-site";

export const Route = createFileRoute("/s/$slug")({
	component: PublishedSiteRoute,
	head: () => ({
		meta: [
			{ title: "Brandkite" },
			{
				name: "description",
				content: "A brand landing page made with Brandkite.",
			},
		],
	}),
});

function PublishedSiteRoute() {
	const { slug } = Route.useParams();
	const data = useQuery(api.site.getSiteBySlug, { slug });

	// Keep the document head in sync with the loaded brand (client-side).
	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		if (!data) {
			return;
		}
		document.title = data.name;
		const description = data.tagline || `${data.name} — made with Brandkite.`;
		let meta = document.head.querySelector<HTMLMetaElement>(
			'meta[name="description"]'
		);
		if (!meta) {
			meta = document.createElement("meta");
			meta.name = "description";
			document.head.append(meta);
		}
		meta.content = description;
	}, [data]);

	if (data === undefined) {
		return (
			<output className="flex min-h-screen items-center justify-center bg-white">
				<span
					aria-hidden="true"
					className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
				/>
				<span className="sr-only">Loading</span>
			</output>
		);
	}

	if (data === null) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white px-6">
				<div className="text-center">
					<p className="font-semibold text-gray-900 text-lg">
						This site isn't available
					</p>
					<p className="mt-2 text-gray-500 text-sm">
						The page you're looking for may have been unpublished or moved.
					</p>
					<a
						className="mt-6 inline-block text-gray-400 text-xs transition-colors hover:text-gray-600"
						href="https://brandkite.co"
						rel="noopener noreferrer"
						target="_blank"
					>
						Made with Brandkite
					</a>
				</div>
			</div>
		);
	}

	return <PublishedSite data={data} />;
}
