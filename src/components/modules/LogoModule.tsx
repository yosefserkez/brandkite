import type { Id } from "../../../convex/_generated/dataModel";
import { useBrandModule } from "../../hooks/useBrandModule";
import { BlockWrapper } from "./BlockWrapper";

type LogoModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

type LogoData = {
	url?: string;
	svg?: string;
	variations?: Array<{ name: string; url: string }>;
};

export default function LogoModule({ companyId, className }: LogoModuleProps) {
	const ctx = useBrandModule(companyId, "logo");

	const data = ctx.selected?.data as LogoData | undefined;
	const logoUrl = data?.url || data?.svg;

	const onCopy = () => {
		if (data?.svg) {
			navigator.clipboard.writeText(data.svg);
		} else if (logoUrl) {
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
		>
			{/* Logo container with profile photo styling */}
			<div className="relative h-32 w-32 overflow-hidden rounded-lg border-4 border-white bg-white shadow-lg">
				{logoUrl ? (
					<img
						alt="Brand logo"
						className="h-full w-full object-contain p-2"
						height={128}
						src={logoUrl}
						width={128}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gray-100">
						<span className="font-bold text-4xl text-gray-400">?</span>
					</div>
				)}
			</div>
		</BlockWrapper>
	);
}
