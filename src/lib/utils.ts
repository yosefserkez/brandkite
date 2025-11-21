import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const UPPER_CASE_REGEX = /([A-Z])/g;
const FIRST_CHAR_REGEX = /^./;

export function toTitleFormat(str: string) {
	return str
		.replace(UPPER_CASE_REGEX, " $1")
		.replace(FIRST_CHAR_REGEX, (char) => char.toUpperCase())
		.trim();
}
