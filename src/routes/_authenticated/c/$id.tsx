import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { BrandStudioPage } from "@/components/BrandStudioPage";

export const Route = createFileRoute("/_authenticated/c/$id")({
	component: CompanyRoute,
});

function CompanyRoute() {
	const { id } = Route.useParams();
	return <BrandStudioPage companyId={id as Id<"companies">} />;
}
