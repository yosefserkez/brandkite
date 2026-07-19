import type { BrandModuleType } from "@convex/workflows";
import type { Id } from "../../../convex/_generated/dataModel";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import { cn, toTitleFormat } from "../../lib/utils";
import { SuspenseCard } from "../suspense-card";
import { Card, CardContent, CardHeader } from "../ui/card";
import { BlockWrapper } from "./BlockWrapper";

type TextModuleConfig = {
	title?: string;
	cardClassName?: string;
	textClassName?: string;
	actionsVariant?: "compact" | "full";
	contentHeight?: number;
};

type TextModuleProps = {
	companyId: Id<"companies">;
	className?: string;
	module: BrandModuleType;
	config?: TextModuleConfig;
};

export default function TextModule({
	companyId,
	module,
	className,
	config,
}: TextModuleProps) {
	const ctx = useBrandModule(companyId, module);
	const { replace } = useBrandText();
	const data = ctx.selected?.data as
		| { [K in typeof module]: string }
		| undefined;
	const text = data?.[module];
	const title = config?.title ?? toTitleFormat(module);

	const onCopy = () => {
		if (text) {
			navigator.clipboard.writeText(replace(text));
		}
	};

	return (
		<BlockWrapper
			actionHandlers={{ onCopy }}
			actionsVariant={config?.actionsVariant ?? "compact"}
			className={className}
			ctx={ctx}
			loadingSkeleton={
				<SuspenseCard
					contentHeight={config?.contentHeight}
					headerText={title}
				/>
			}
		>
			<Card className={config?.cardClassName}>
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch font-medium text-[11px] text-gray-400 uppercase tracking-[0.08em]">
						{title}
					</p>
				</CardHeader>
				<CardContent>
					<BrandText
						as="p"
						className={cn(
							"wrap-break-word text-gray-950 text-xl tracking-tight",
							config?.textClassName
						)}
					>
						{text ?? ""}
					</BrandText>
				</CardContent>
			</Card>
		</BlockWrapper>
	);
}
