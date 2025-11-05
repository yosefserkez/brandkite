"use client";

import { File } from "lucide-react";
import { createContext, useContext } from "react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

const SourceContext = createContext<{
	href?: string;
	domain: string;
	isFile?: boolean;
	faviconUrl?: string;
} | null>(null);

function useSourceContext() {
	const ctx = useContext(SourceContext);
	if (!ctx) {
		throw new Error("Source.* must be used inside <Source>");
	}
	return ctx;
}

export type SourceProps = {
	href?: string;
	fileName?: string;
	faviconUrl?: string;
	children: React.ReactNode;
};

export function Source({ href, fileName, faviconUrl, children }: SourceProps) {
	const isFile = !!fileName;
	let domain = "";

	if (isFile) {
		domain = fileName;
	} else if (href) {
		try {
			domain = new URL(href).hostname;
		} catch {
			domain = href.split("/").pop() || href;
		}
	}

	return (
		<SourceContext.Provider value={{ href, domain, isFile, faviconUrl }}>
			<HoverCard closeDelay={0} openDelay={150}>
				{children}
			</HoverCard>
		</SourceContext.Provider>
	);
}

export type SourceTriggerProps = {
	label?: string | number;
	showIcon?: boolean;
	className?: string;
};

export function SourceTrigger({
	label,
	showIcon = false,
	className,
}: SourceTriggerProps) {
	const { href, domain, isFile, faviconUrl } = useSourceContext();
	const labelToShow = label ?? domain.replace("www.", "");

	let icon: React.ReactNode | null = null;
	if (showIcon) {
		switch (true) {
			case isFile:
				icon = <File className="size-3.5 shrink-0" />;
				break;
			case !!href || !!faviconUrl:
				icon = (
					<img
						alt="favicon"
						className="size-3.5 shrink-0 rounded-full"
						height={14}
						src={
							faviconUrl ||
							`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(href || "")}`
						}
						width={14}
					/>
				);
				break;
			default:
				icon = (
					<span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-[8px] text-gray-600">
						{typeof label === "string" && label.length > 0
							? label.slice(0, 1).toUpperCase()
							: ""}
					</span>
				);
				break;
		}
	}

	return (
		<HoverCardTrigger asChild>
			<a
				className={cn(
					"inline-flex h-5 max-w-32 items-center gap-1 overflow-hidden rounded-full bg-muted py-0 text-muted-foreground text-xs leading-none no-underline transition-colors duration-150 hover:bg-muted-foreground/30 hover:text-primary",
					showIcon ? "pr-2 pl-1" : "px-1",
					className
				)}
				href={href || undefined}
				rel={isFile ? undefined : "noopener noreferrer"}
				target={isFile ? undefined : "_blank"}
			>
				{icon}
				<span className="truncate text-center font-normal">{labelToShow}</span>
			</a>
		</HoverCardTrigger>
	);
}

export type SourceContentProps = {
	title: string;
	description: string;
	className?: string;
};

export function SourceContent({
	title,
	description,
	className,
}: SourceContentProps) {
	const { href, domain, isFile, faviconUrl } = useSourceContext();

	let icon: React.ReactNode | null = null;
	if (isFile) {
		icon = <File className="size-4" />;
	} else if (href || faviconUrl) {
		icon = (
			<img
				alt="favicon"
				className="size-4 rounded-full"
				height={16}
				src={
					faviconUrl ||
					`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(href || "")}`
				}
				width={16}
			/>
		);
	} else {
		icon = (
			<span className="flex size-4 items-center justify-center rounded-full bg-gray-200 font-medium text-[8px] text-gray-600">
				{typeof title === "string" && title.length > 0
					? title.slice(0, 1).toUpperCase()
					: ""}
			</span>
		);
	}

	return (
		<HoverCardContent className={cn("w-80 p-0 shadow-xs", className)}>
			<a
				className="flex flex-col gap-2 p-3"
				href={href || undefined}
				rel={isFile ? undefined : "noopener noreferrer"}
				target={isFile ? undefined : "_blank"}
			>
				<div className="flex items-center gap-1.5">
					{icon}
					<div className="truncate text-primary text-sm">
						{domain.replace("www.", "")}
					</div>
				</div>
				<div className="line-clamp-2 font-medium text-sm">{title}</div>
				<div className="max-h-24 overflow-scroll text-muted-foreground text-sm">
					{description}
				</div>
			</a>
		</HoverCardContent>
	);
}
