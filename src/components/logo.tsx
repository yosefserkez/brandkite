type LogoProps = { svg: string; url?: never } | { svg?: never; url: string };

export default function Logo(props: LogoProps) {
	if (props.svg) {
		return <InlineSVG svg={props.svg} />;
	}
	if (props.url) {
		// Use img tag for URLs to avoid CORS issues (browsers handle img CORS more leniently)
		return (
			<div className="logo h-full w-full">
				<img
					alt="Logo"
					className="h-full w-full object-contain"
					height="100"
					src={props.url}
					width="100"
				/>
			</div>
		);
	}
	return null;
}

type InlineSVGProps = { svg: string };

function InlineSVG(props: InlineSVGProps) {
	return (
		<div
			className="logo h-full w-full"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: needed to set the SVG
			dangerouslySetInnerHTML={{ __html: props.svg }}
		/>
	);
}
