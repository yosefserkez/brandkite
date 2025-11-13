import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LogoModuleData } from "../../../convex/modules/logo";
import { useBrandModule } from "../../hooks/useBrandModule";
import Logo from "../logo";
import { SkeletonFlickeringGrid } from "../skeleton-flickering-grid";
import { Card, CardContent } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type LogoModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function LogoModule({ companyId, className }: LogoModuleProps) {
	const ctx = useBrandModule(companyId, "logo");

	const data = ctx.selected?.data as LogoModuleData | undefined;

	const logoUrl = useQuery(api.r2.getSignedUrl, {
		key: data?.storageKey,
	});

	const onCopy = () => {
		if (logoUrl) {
			navigator.clipboard.writeText(logoUrl);
		}
	};

	const onDownload = () => {
		if (!logoUrl) {
			return;
		}
		const a = document.createElement("a");
		a.href = logoUrl;
		a.download = "logo.svg";
		a.click();
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy, onDownload }}
			actionsVariant="compact"
			className={className}
			ctx={ctx}
			loadingSkeleton={<SkeletonFlickeringGrid height={200} />}
		>
			<Card>
				<CardContent>
					{logoUrl ? (
						<Logo url={logoUrl} />
					) : (
						<SkeletonFlickeringGrid height={400} />
					)}
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
