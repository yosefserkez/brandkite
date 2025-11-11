import { useEffect, useState } from "react";

export default function Logo({ url }: { url: string }) {
	return <InlineSVG url={url} />;
}

function InlineSVG({ url }: { url: string }) {
	const [svg, setSvg] = useState("");

	useEffect(() => {
		fetch(url)
			.then((res) => {
				if (res.status !== 200) {
					return;
				}
				return res.text();
			})
			.then((text) => {
				if (text !== undefined) {
					setSvg(text);
				}
			})
			.catch((error) => {
				throw error;
			});
	}, [url]);

	return (
		<>
			{svg ? (
				// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to override fill and height/width
				<div
					className="logo h-full w-full"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to set the SVG
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-gray-100">
					<span className="font-bold text-4xl text-gray-400">?</span>
				</div>
			)}
		</>
	);
}
