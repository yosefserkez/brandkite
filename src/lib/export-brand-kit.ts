const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/g;
const LEADING_TRAILING_HYPHEN_REGEX = /^-+|-+$/g;

export function slugifyBrandName(name: string | null | undefined): string {
	const slug = (name || "brand")
		.toLowerCase()
		.trim()
		.replace(NON_ALPHANUMERIC_REGEX, "-")
		.replace(LEADING_TRAILING_HYPHEN_REGEX, "");
	return slug || "brand";
}

export function downloadBrandMarkdown(
	markdown: string,
	brandName: string | null | undefined
) {
	const blob = new Blob([markdown], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${slugifyBrandName(brandName)}-brand-kit.md`;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}
