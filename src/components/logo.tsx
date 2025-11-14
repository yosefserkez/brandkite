import { useEffect, useState } from "react";

type LogoProps = { svg: string; url?: never } | { svg?: never; url: string };

export default function Logo(props: LogoProps) {
	if (props.svg) {
		return <InlineSVG svg={props.svg} />;
	}
	if (props.url) {
		return <InlineSVG url={props.url} />;
	}
	return null;
}

type InlineSVGProps =
	| { svg: string; url?: never }
	| { svg?: never; url: string };

function InlineSVG(props: InlineSVGProps) {
	const [svg, setSvg] = useState(props.svg ?? "");

	useEffect(() => {
		if (props.svg) {
			setSvg(props.svg);
			return;
		}
		if (!props.url) {
			return;
		}
		const HTTP_OK_STATUS = 200;
		fetch(props.url)
			.then((res) => {
				if (res.status !== HTTP_OK_STATUS) {
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
	}, [props.svg, props.url]);

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
