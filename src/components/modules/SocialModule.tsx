import { Authenticated } from "convex/react";
import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { BrandSocial } from "../../../convex/modules/social";
import { BrandText, useBrandText } from "../../contexts/BrandTextContext";
import { useBrandModule } from "../../hooks/useBrandModule";
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
import { BlockWrapper } from "./BlockWrapper";

type SocialTone = "brand" | "professional" | "casual" | "bold";

const TONE_OPTIONS: { value: SocialTone; label: string }[] = [
	{ value: "brand", label: "Brand voice" },
	{ value: "professional", label: "Professional" },
	{ value: "casual", label: "Casual" },
	{ value: "bold", label: "Bold" },
];

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
									<BioCard bio={bio} key={`${bio.platform}-${index}`} />
								))}
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								{data.posts.map((post, index) => (
									<PostCard key={`${post.hook}-${index}`} post={post} />
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

type SocialBio = BrandSocial["bios"][number];

function BioCard({ bio }: { bio: SocialBio }) {
	const { replace } = useBrandText();

	const onCopy = () => {
		const text = replace(bio.bio);
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<div className="group/bio flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-[11px] text-gray-400 uppercase tracking-wide">
					{replace(bio.platform)}
				</span>
				<button
					aria-label="Copy bio"
					className="text-gray-300 opacity-0 transition hover:text-gray-600 group-hover/bio:opacity-100"
					onClick={onCopy}
					title="Copy bio"
					type="button"
				>
					<Copy className="h-3.5 w-3.5" />
				</button>
			</div>
			<span className="pt-1.5 text-gray-500 text-sm">
				@{replace(bio.handle)}
			</span>
			<BrandText
				as="p"
				className="wrap-break-word pt-2 text-gray-900 text-sm leading-relaxed"
			>
				{bio.bio}
			</BrandText>
		</div>
	);
}

type SocialPost = BrandSocial["posts"][number];

function PostCard({ post }: { post: SocialPost }) {
	const { replace } = useBrandText();

	const onCopy = () => {
		const text = [replace(post.hook), "", replace(post.body)].join("\n");
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<div className="group/post flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4">
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-[11px] text-gray-400 uppercase tracking-wide">
					Post
				</span>
				<button
					aria-label="Copy post"
					className="text-gray-300 opacity-0 transition hover:text-gray-600 group-hover/post:opacity-100"
					onClick={onCopy}
					title="Copy post"
					type="button"
				>
					<Copy className="h-3.5 w-3.5" />
				</button>
			</div>
			<BrandText
				as="p"
				className="wrap-break-word pt-2 font-semibold text-base text-gray-900 leading-snug tracking-tight"
			>
				{post.hook}
			</BrandText>
			<BrandText
				as="p"
				className="wrap-break-word pt-1.5 text-gray-500 text-sm leading-relaxed"
			>
				{post.body}
			</BrandText>
		</div>
	);
}
