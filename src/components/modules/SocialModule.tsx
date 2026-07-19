import { Authenticated } from "convex/react";
import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandSocial } from "../../../convex/modules/social";
import { useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
import { useCompanyBrandSelector } from "../../hooks/useCompanyBrand";
import { SuspenseCard } from "../suspense-card";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { slugify } from "./AdMockups";
import { BlockWrapper } from "./BlockWrapper";
import {
	SocialPostMockup,
	type SocialPostPlacement,
	SocialProfileMockup,
} from "./SocialMockups";

type SocialTone = "brand" | "professional" | "casual" | "bold";

const TONE_OPTIONS: { value: SocialTone; label: string }[] = [
	{ value: "brand", label: "Brand voice" },
	{ value: "professional", label: "Professional" },
	{ value: "casual", label: "Casual" },
	{ value: "bold", label: "Bold" },
];

/** Alternate organic post frames: first post as X, second as LinkedIn. */
const POST_PLACEMENTS: SocialPostPlacement[] = ["x", "linkedin"];

type SocialModuleProps = {
	companyId: Id<"companies">;
	className?: string;
};

export default function SocialModule({
	companyId,
	className,
}: SocialModuleProps) {
	const ctx = useBrandModule(companyId, "social");
	const [tone, setTone] = useState<SocialTone>("brand");

	const data = ctx.selected?.data as BrandSocial | undefined;

	const onRegenerate = () => ctx.regenerate({ options: { tone } });

	return (
		<BlockWrapper
			actionHandlers={{ onRegenerate }}
			className={className}
			ctx={ctx}
			loadingSkeleton={<SuspenseCard headerText="Social" />}
		>
			<Card>
				<CardHeader>
					<p className="wrap-break-word col-span-full place-self-stretch text-gray-900">
						Social
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					{data && (
						<>
							<div className="grid gap-4 md:grid-cols-3">
								{data.bios.map((bio, index) => (
									<BioArtifact bio={bio} key={`${bio.platform}-${index}`} />
								))}
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								{data.posts.map((post, index) => (
									<PostArtifact
										key={`${post.hook}-${index}`}
										placement={POST_PLACEMENTS[index % POST_PLACEMENTS.length]}
										post={post}
									/>
								))}
							</div>
						</>
					)}
				</CardContent>
			</Card>
			<Authenticated>
				<div className="absolute top-2 left-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								className="rounded-md bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/80"
								size="icon-sm"
								title="Generation options"
								variant="ghost"
							>
								<SlidersHorizontal className="h-3.5 w-3.5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" className="w-64 space-y-3">
							<div className="space-y-1.5">
								<span className="font-medium text-xs">Tone</span>
								<Select
									onValueChange={(value) => setTone(value as SocialTone)}
									value={tone}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TONE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</Authenticated>
		</BlockWrapper>
	);
}

/** Caption row shared by bios and posts: label left, copy right. */
function ArtifactCaption({
	label,
	onCopy,
}: {
	label: string;
	onCopy: () => void;
}) {
	return (
		<div className="flex items-center justify-between gap-2 px-1">
			<span className="truncate text-[11px] text-gray-400">{label}</span>
			<button
				aria-label={`Copy ${label}`}
				className="flex shrink-0 items-center gap-1 rounded-md p-1.5 text-[11px] text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
				onClick={onCopy}
				type="button"
			>
				<Copy className="size-3" />
				Copy
			</button>
		</div>
	);
}

type SocialBio = BrandSocial["bios"][number];

function BioArtifact({ bio }: { bio: SocialBio }) {
	const { replace, companyName } = useBrandText();
	const logoUrl = useCompanyBrandSelector((state) => state.logoUrl);
	const brandName = companyName?.trim() || "Your brand";

	const onCopy = () => {
		navigator.clipboard
			.writeText(replace(bio.bio))
			.then(() => toast.success("Copied"));
	};

	return (
		<div className="flex h-full flex-col gap-1.5">
			<SocialProfileMockup
				bio={replace(bio.bio)}
				brandName={brandName}
				handle={replace(bio.handle)}
				logoUrl={logoUrl}
				platform={replace(bio.platform)}
			/>
			<ArtifactCaption label={`${replace(bio.platform)} bio`} onCopy={onCopy} />
		</div>
	);
}

type SocialPost = BrandSocial["posts"][number];

function PostArtifact({
	post,
	placement,
}: {
	post: SocialPost;
	placement: SocialPostPlacement;
}) {
	const { replace, companyName } = useBrandText();
	const logoUrl = useCompanyBrandSelector((state) => state.logoUrl);
	const brandName = companyName?.trim() || "Your brand";

	const onCopy = () => {
		const text = [replace(post.hook), "", replace(post.body)].join("\n");
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<div className="flex h-full flex-col gap-1.5">
			<SocialPostMockup
				body={replace(post.body)}
				brandName={brandName}
				handle={slugify(brandName)}
				hook={replace(post.hook)}
				logoUrl={logoUrl}
				placement={placement}
			/>
			<ArtifactCaption
				label={placement === "linkedin" ? "LinkedIn draft" : "X draft"}
				onCopy={onCopy}
			/>
		</div>
	);
}
