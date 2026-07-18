import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { PublishedSite } from "@/components/site/published-site";

type SiteData = Awaited<ReturnType<typeof loadSite>>;

const SITE_ORIGIN = "https://brandkite.co";

// Server-side (and on client navigation) fetch so the published site is fully
// SSR'd: crawlable body + correct <title>/description/OG tags in the document
// head. Real-time updates aren't needed for a static marketing page.
async function loadSite(slug: string) {
	const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
	if (!url) {
		return null;
	}
	try {
		const client = new ConvexHttpClient(url);
		return await client.query(api.site.getSiteBySlug, { slug });
	} catch {
		// Never let a backend hiccup crash SSR — fall through to the
		// unavailable state, which the client can recover from on retry.
		return null;
	}
}

export const Route = createFileRoute("/s/$slug")({
	component: PublishedSiteRoute,
	loader: ({ params }) => loadSite(params.slug),
	head: ({ loaderData, params }) => {
		const data = loaderData as SiteData;
		const canonical = `${SITE_ORIGIN}/s/${params?.slug ?? ""}`;

		if (!data) {
			return {
				meta: [
					{ title: "Brandkite" },
					{
						name: "description",
						content: "A brand landing page made with Brandkite.",
					},
				],
			};
		}

		const title = data.name;
		const description = data.tagline || `${data.name} — made with Brandkite.`;
		const image = data.logoUrl ?? undefined;

		const meta: Array<Record<string, string>> = [
			{ title },
			{ name: "description", content: description },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: canonical },
			{ property: "og:site_name", content: title },
			{
				name: "twitter:card",
				content: image ? "summary" : "summary_large_image",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
		];
		if (image) {
			meta.push({ property: "og:image", content: image });
			meta.push({ name: "twitter:image", content: image });
		}

		return {
			meta,
			links: [{ rel: "canonical", href: canonical }],
		};
	},
});

function PublishedSiteRoute() {
	const data = Route.useLoaderData();
	const { slug } = Route.useParams();

	if (data === null || data === undefined) {
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

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: data.name,
		url: `${SITE_ORIGIN}/s/${slug}`,
		...(data.tagline ? { description: data.tagline } : {}),
		...(data.logoUrl ? { logo: data.logoUrl } : {}),
	};

	return (
		<>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from
			    trusted server data, serialized via JSON.stringify. */}
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				type="application/ld+json"
			/>
			<PublishedSite data={data} />
		</>
	);
}
