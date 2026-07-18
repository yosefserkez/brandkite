import { useConvex, useMutation } from "convex/react";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BrandTextProvider } from "../contexts/BrandTextContext";
import { useCompanyBrand, useCompanyBrandName } from "../hooks/useCompanyBrand";
import { track } from "../lib/analytics";
import { downloadBrandMarkdown } from "../lib/export-brand-kit";
import { GetStartedCard } from "./get-started-card";
import ColorsModule from "./modules/ColorsModule";
import LogoModule from "./modules/LogoModule";
import MarketingModule from "./modules/MarketingModule";
import NamesModule from "./modules/NamesModule";
import TextModule from "./modules/TextModule";
import ToneModule from "./modules/ToneModule";
import TypographyModule from "./modules/TypographyModule";
import { Button } from "./ui/button";
import { FlickeringGrid } from "./ui/flickering-grid";

type BrandStudioPageProps = {
	companyId: Id<"companies">;
};

export function BrandStudioPage({ companyId }: BrandStudioPageProps) {
	const { company, loading } = useCompanyBrand(companyId);
	const companyName = useCompanyBrandName(companyId);
	const updatePresence = useMutation(api.presence.updatePresence);
	const convex = useConvex();
	const [isExporting, setIsExporting] = useState(false);

	useEffect(() => {
		// biome-ignore lint/complexity/noVoid: deliberate fire-and-forget presence update
		void updatePresence({ companyId });
	}, [companyId, updatePresence]);

	const handleExportClick = async () => {
		track("share_clicked", { surface: "export_markdown" });
		setIsExporting(true);
		try {
			const markdown = await convex.query(api.export.exportBrandMarkdown, {
				companyId,
			});
			if (!markdown) {
				toast.error("Nothing to export yet");
				return;
			}
			downloadBrandMarkdown(markdown, companyName ?? company?.name);
			toast.success("Brand kit exported");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to export brand kit"
			);
		} finally {
			setIsExporting(false);
		}
	};

	if (loading || !company) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-full w-full">
					<FlickeringGrid />
				</div>
			</div>
		);
	}

	return (
		<BrandTextProvider companyName={companyName}>
			<div className="mb-4 h-full overflow-y-auto bg-white">
				{/* Module blocks */}
				<div className="mx-auto max-w-5xl space-y-10 overflow-hidden px-4 py-4">
					<div className="flex justify-end">
						<Button
							disabled={isExporting}
							onClick={handleExportClick}
							size="sm"
							variant="outline"
						>
							<Download className="h-3.5 w-3.5" />
							<span>Export as Markdown</span>
						</Button>
					</div>
					{/* Names & Logo block - combined as header image with logo overlay */}
					<NamesModule companyId={companyId} />
					<div className="flex flex-col gap-10 md:grid md:grid-cols-4 md:grid-rows-1 md:gap-4 md:pb-6">
						<div className="col-span-1 flex flex-col gap-10 md:gap-4">
							<LogoModule className="h-full w-full" companyId={companyId} />
							<div className="hidden h-full w-full rounded-t-lg bg-linear-to-b from-brand-primary-50 to-gray-50 md:block" />
						</div>
						<div className="col-span-3 flex flex-col gap-10 md:gap-4">
							<TextModule
								companyId={companyId}
								config={{
									textClassName: "font-semibold md:text-xl lg:text-2xl",
								}}
								module="mission"
							/>
							<TextModule
								companyId={companyId}
								config={{
									textClassName: "md:text-xl lg:text-2xl",
								}}
								module="tagline"
							/>
						</div>
					</div>
					<TextModule
						companyId={companyId}
						config={{
							textClassName: "text-justify",
							actionsVariant: "full",
						}}
						module="story"
					/>
					<MarketingModule companyId={companyId} />
					<ColorsModule companyId={companyId} />
					<ToneModule companyId={companyId} />
					<TypographyModule companyId={companyId} />
					<div className="mt-12 flex flex-col items-center gap-2 rounded-lg bg-gray-50 p-4 text-center">
						<p className="text-gray-500 text-sm">
							Questions, suggestions, or feedback?&nbsp;
							<a
								className="text-brand-primary-700 underline transition-colors hover:text-brand-primary-900 focus:outline-none focus:ring-1 focus:ring-brand-primary-300"
								href="mailto:yosef@brandkite.co"
							>
								Contact us
							</a>
						</p>
					</div>
					<GetStartedCard />
				</div>
			</div>
		</BrandTextProvider>
	);
}
