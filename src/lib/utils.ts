import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function replaceCompanyName(
	text: string | undefined | null,
	companyName: string | undefined | null
) {
	if (!(text && companyName)) {
		return text ?? "";
	}
	return text.replace(/{company_name}/g, companyName);
}
