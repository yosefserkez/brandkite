import { useEffect, useState } from "react";

export default function Logo({ url }: { url: string }) {
	return <InlineSVG url={url} />;
}

function InlineSVG({ url }: { url: string }) {
	const [svg, setSvg] = useState("");

	useEffect(() => {
		fetch(url)
			.then((res) => res.text())
			.then(setSvg);
	}, [url]);

	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to override fill and height/width
		<div
			className="logo h-full w-full"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to set the SVG
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
