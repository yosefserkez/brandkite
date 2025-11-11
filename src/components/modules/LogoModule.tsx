import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { LogoModuleData } from "../../../convex/modules/logo";
import { useBrandModule } from "../../hooks/useBrandModule";
import Logo from "../logo";
import { Ripple } from "../ui/ripple";
import { BlockWrapper } from "./BlockWrapper";

type LogoModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

const loadingSkeleton = (
	<div className="h-full w-full items-center justify-center rounded-lg border-4 border-white bg-white shadow-lg">
		<Ripple className="h-full w-full" mainCircleSize={40} numCircles={2} />
	</div>
);

export default function LogoModule({ companyId, className }: LogoModuleProps) {
	const ctx = useBrandModule(companyId, "logo");

	const data = ctx.selected?.data as LogoModuleData | undefined;

	const logoUrl = useQuery(api.r2.getSignedUrl, {
		key: data?.storageKey ?? " ",
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
			loadingSkeleton={loadingSkeleton}
		>
			{/* Logo container with profile photo styling */}
			<div className="relative h-full w-full overflow-hidden rounded-lg border-4 border-white bg-white shadow-lg">
				{logoUrl ? <Logo url={logoUrl} /> : loadingSkeleton}
			</div>
		</BlockWrapper>
	);
}
