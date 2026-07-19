import type { ComponentProps } from "react";

export function BrandKiteLogo(props: ComponentProps<"img">) {
	return (
		<img
			alt="Brandkite logo"
			height={32}
			src="/logo.svg"
			width={32}
			{...props}
		/>
	);
}
