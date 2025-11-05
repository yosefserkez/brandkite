import { createFileRoute } from "@tanstack/react-router";
import { BrandStudioPage } from "@/components/BrandStudioPage";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/c/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = Route.useParams();
	return <BrandStudioPage companyId={id as Id<"companies">} />;
}
