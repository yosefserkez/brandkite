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

/** Circle avatar with the brand initial — stands in for the profile photo. */
function BrandAvatar({ name }: { name: string }) {
	return (
		<span
			aria-hidden="true"
			className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 font-semibold text-[13px] text-gray-700"
		>
			{name.trim().charAt(0).toUpperCase() || "B"}
		</span>
	);
}

function CopyButton({
	label,
	onCopy,
	groupClass,
}: {
	label: string;
	onCopy: () => void;
	groupClass: string;
}) {
	return (
		<button
			aria-label={label}
			className={`rounded-md p-1 text-gray-300 opacity-0 transition hover:text-gray-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${groupClass}`}
			onClick={onCopy}
			title={label}
			type="button"
		>
			<Copy className="h-3.5 w-3.5" />
		</button>
	);
}

/** A bio framed as the profile it will live on: avatar, name, handle, bio. */
function BioCard({ bio }: { bio: SocialBio }) {
	const { replace, companyName } = useBrandText();
	const brandName = companyName?.trim() || "Your brand";

	const onCopy = () => {
		const text = replace(bio.bio);
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<figure className="group/bio flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
			<figcaption className="sr-only">
				{replace(bio.platform)} bio preview for {brandName}
			</figcaption>
			<div className="flex items-center gap-2.5">
				<BrandAvatar name={brandName} />
				<span className="min-w-0 flex-1 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{brandName}
					</span>
					<span className="block truncate text-[11px] text-gray-400">
						@{replace(bio.handle)}
					</span>
				</span>
				<span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-400">
					{replace(bio.platform)}
				</span>
				<CopyButton
					groupClass="group-hover/bio:opacity-100"
					label="Copy bio"
					onCopy={onCopy}
				/>
			</div>
			<BrandText
				as="p"
				className="wrap-break-word pt-3 text-gray-700 text-sm leading-relaxed"
			>
				{bio.bio}
			</BrandText>
		</figure>
	);
}

type SocialPost = BrandSocial["posts"][number];

/** A post framed as it will appear in a feed: profile row, then the post. */
function PostCard({ post }: { post: SocialPost }) {
	const { replace, companyName } = useBrandText();
	const brandName = companyName?.trim() || "Your brand";

	const onCopy = () => {
		const text = [replace(post.hook), "", replace(post.body)].join("\n");
		navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
	};

	return (
		<figure className="group/post flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
			<figcaption className="sr-only">Post preview for {brandName}</figcaption>
			<div className="flex items-center gap-2.5">
				<BrandAvatar name={brandName} />
				<span className="min-w-0 flex-1 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{brandName}
					</span>
					<span className="block text-[11px] text-gray-400">Draft post</span>
				</span>
				<CopyButton
					groupClass="group-hover/post:opacity-100"
					label="Copy post"
					onCopy={onCopy}
				/>
			</div>
			<BrandText
				as="p"
				className="wrap-break-word pt-3 font-medium text-[15px] text-gray-900 leading-snug"
			>
				{post.hook}
			</BrandText>
			<BrandText
				as="p"
				className="wrap-break-word pt-1.5 text-gray-600 text-sm leading-relaxed"
			>
				{post.body}
			</BrandText>
		</figure>
	);
}
