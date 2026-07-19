import {
	Globe,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Repeat2,
	Send,
	Share2,
	ThumbsUp,
} from "lucide-react";
import { AdCreative, BrandMark } from "./AdMockups";

type SocialProfileProps = {
	brandName: string;
	handle: string;
	bio: string;
	logoUrl?: string | null;
};

type SocialPostProps = {
	brandName: string;
	handle: string;
	hook: string;
	body: string;
	logoUrl?: string | null;
};

const PROFILE_COMPONENTS: Record<
	string,
	(props: SocialProfileProps) => ReturnType<typeof XProfile>
> = {
	x: XProfile,
	twitter: XProfile,
	linkedin: LinkedInProfile,
	instagram: InstagramProfile,
};

/**
 * A generated bio rendered inside an authentic mock of the profile it
 * will live on. Non-interactive artifact; platform chrome intentionally
 * uses each network's own conventions rather than brand tokens.
 */
export function SocialProfileMockup({
	platform,
	...props
}: SocialProfileProps & { platform: string }) {
	const Profile =
		PROFILE_COMPONENTS[platform.trim().toLowerCase()] ?? GenericProfile;
	return (
		<figure className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
			<figcaption className="sr-only">
				{platform} bio preview for {props.brandName}
			</figcaption>
			<Profile {...props} />
		</figure>
	);
}

/* ------------------------------------------------------------------ */
/* X profile                                                           */
/* ------------------------------------------------------------------ */

function XProfile({ brandName, handle, bio, logoUrl }: SocialProfileProps) {
	return (
		<div className="flex h-full flex-col">
			<AdCreative
				brandName={brandName}
				className="aspect-[3/1]"
				height={260}
				logoUrl={logoUrl}
				seed={`profile-x-${handle}`}
				showLogoChip={false}
				width={780}
			/>
			<div className="flex items-start justify-between px-3">
				<BrandMark
					brandName={brandName}
					className="-mt-6 relative size-12 ring-4 ring-white"
					logoUrl={logoUrl}
				/>
				<span className="mt-2 rounded-full bg-gray-900 px-4 py-1 font-semibold text-[13px] text-white">
					Follow
				</span>
			</div>
			<div className="flex-1 px-3 pt-1.5 pb-3.5">
				<p className="truncate font-bold text-[15px] text-gray-900 leading-tight">
					{brandName}
				</p>
				<p className="truncate text-[12px] text-gray-500">@{handle}</p>
				<p className="wrap-break-word mt-1.5 text-[13px] text-gray-900 leading-normal">
					{bio}
				</p>
				<p className="mt-2 flex gap-4 text-[12px] text-gray-500">
					<span>
						<span className="font-semibold text-gray-900 tabular-nums">
							1,024
						</span>{" "}
						Following
					</span>
					<span>
						<span className="font-semibold text-gray-900 tabular-nums">
							3,482
						</span>{" "}
						Followers
					</span>
				</p>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* LinkedIn company page                                               */
/* ------------------------------------------------------------------ */

function LinkedInProfile({
	brandName,
	handle,
	bio,
	logoUrl,
}: SocialProfileProps) {
	return (
		<div className="flex h-full flex-col">
			<AdCreative
				brandName={brandName}
				className="aspect-[3/1]"
				height={260}
				logoUrl={logoUrl}
				seed={`profile-linkedin-${handle}`}
				showLogoChip={false}
				width={780}
			/>
			<div className="px-3">
				<BrandMark
					brandName={brandName}
					className="-mt-6 relative size-12 ring-4 ring-white"
					logoUrl={logoUrl}
					shape="square"
				/>
			</div>
			<div className="flex-1 px-3 pt-1.5 pb-3.5">
				<p className="truncate font-bold text-[15px] text-gray-900 leading-tight">
					{brandName}
				</p>
				<p className="wrap-break-word mt-1 text-[13px] text-gray-600 leading-normal">
					{bio}
				</p>
				<p className="mt-1.5 text-[12px] text-gray-500">
					<span className="tabular-nums">2,417</span> followers
				</p>
				<span className="mt-2.5 inline-block rounded-full bg-[#0A66C2] px-4 py-1 font-semibold text-[13px] text-white">
					+ Follow
				</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Instagram profile                                                   */
/* ------------------------------------------------------------------ */

function InstagramProfile({
	brandName,
	handle,
	bio,
	logoUrl,
}: SocialProfileProps) {
	return (
		<div className="flex h-full flex-col px-3.5 py-3.5">
			<div className="flex items-center gap-4">
				<BrandMark
					brandName={brandName}
					className="size-14"
					logoUrl={logoUrl}
				/>
				<div className="flex flex-1 items-center justify-around text-center leading-tight">
					{[
						["128", "posts"],
						["3,482", "followers"],
						["1,024", "following"],
					].map(([count, label]) => (
						<span key={label}>
							<span className="block font-semibold text-[14px] text-gray-900 tabular-nums">
								{count}
							</span>
							<span className="block text-[11px] text-gray-500">{label}</span>
						</span>
					))}
				</div>
			</div>
			<p className="mt-2.5 truncate font-semibold text-[13px] text-gray-900">
				@{handle}
			</p>
			<p className="wrap-break-word mt-0.5 flex-1 text-[13px] text-gray-900 leading-normal">
				{bio}
			</p>
			<span className="mt-3 block rounded-lg bg-[#0095F6] py-1.5 text-center font-semibold text-[13px] text-white">
				Follow
			</span>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Fallback profile (unknown platform)                                 */
/* ------------------------------------------------------------------ */

function GenericProfile({
	brandName,
	handle,
	bio,
	logoUrl,
}: SocialProfileProps) {
	return (
		<div className="flex h-full flex-col p-4">
			<div className="flex items-center gap-2.5">
				<BrandMark brandName={brandName} className="size-8" logoUrl={logoUrl} />
				<span className="min-w-0 flex-1 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{brandName}
					</span>
					<span className="block truncate text-[11px] text-gray-400">
						@{handle}
					</span>
				</span>
			</div>
			<p className="wrap-break-word pt-3 text-gray-700 text-sm leading-relaxed">
				{bio}
			</p>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export type SocialPostPlacement = "x" | "linkedin";

/**
 * A generated post rendered as an organic feed post (no Sponsored
 * label — this is the brand's own content, not an ad).
 */
export function SocialPostMockup({
	placement,
	...props
}: SocialPostProps & { placement: SocialPostPlacement }) {
	const Post = placement === "linkedin" ? LinkedInPost : XPost;
	return (
		<figure className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
			<figcaption className="sr-only">
				Post preview for {props.brandName}
			</figcaption>
			<Post {...props} />
		</figure>
	);
}

function XPost({ brandName, handle, hook, body, logoUrl }: SocialPostProps) {
	return (
		<div className="flex h-full gap-2.5 p-3">
			<BrandMark brandName={brandName} className="size-9" logoUrl={logoUrl} />
			<div className="min-w-0 flex-1">
				<p className="flex min-w-0 items-baseline gap-1 text-[13px] leading-tight">
					<span className="truncate font-bold text-gray-900">{brandName}</span>
					<span className="truncate text-gray-500">@{handle} · 2h</span>
					<MoreHorizontal className="ml-auto size-4 shrink-0 text-gray-400" />
				</p>
				<p className="wrap-break-word mt-1 text-[13px] text-gray-900 leading-normal">
					{hook}
				</p>
				<p className="wrap-break-word mt-2 text-[13px] text-gray-900 leading-normal">
					{body}
				</p>
				<div className="mt-2.5 flex items-center justify-between pr-6 text-gray-500">
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<MessageCircle className="size-4" /> 14
					</span>
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<Repeat2 className="size-4" /> 36
					</span>
					<span className="flex items-center gap-1 text-[12px] tabular-nums">
						<Heart className="size-4" /> 218
					</span>
					<Share2 className="size-4" />
				</div>
			</div>
		</div>
	);
}

function LinkedInPost({ brandName, hook, body, logoUrl }: SocialPostProps) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-start gap-2.5 px-3 pt-3">
				<BrandMark
					brandName={brandName}
					className="size-10"
					logoUrl={logoUrl}
					shape="square"
				/>
				<span className="min-w-0 leading-tight">
					<span className="block truncate font-semibold text-[13px] text-gray-900">
						{brandName}
					</span>
					<span className="block text-[11px] text-gray-500">
						2,417 followers
					</span>
					<span className="flex items-center gap-1 text-[11px] text-gray-500">
						2h · <Globe className="size-3" />
					</span>
				</span>
				<MoreHorizontal className="ml-auto size-4 shrink-0 text-gray-400" />
			</div>
			<p className="wrap-break-word flex-1 px-3 pt-2.5 text-[13px] text-gray-900 leading-normal">
				{hook} {body}
			</p>
			<p className="px-3 pt-2 pb-1.5 text-[11px] text-gray-500">
				<span className="tabular-nums">84</span> ·{" "}
				<span className="tabular-nums">12</span> comments
			</p>
			<div className="mx-3 mb-1 flex items-center justify-around border-gray-100 border-t py-1.5 text-gray-500">
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<ThumbsUp className="size-4" /> Like
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<MessageCircle className="size-4" /> Comment
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<Repeat2 className="size-4" /> Repost
				</span>
				<span className="flex items-center gap-1.5 font-medium text-xs">
					<Send className="size-4" /> Send
				</span>
			</div>
		</div>
	);
}
