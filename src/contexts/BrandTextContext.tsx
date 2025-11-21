import type { ComponentProps, ElementType, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";

type PlaceholderReplacer = (text: string) => string;

type BrandTextContextValue = {
	replace: PlaceholderReplacer;
	companyName: string | null | undefined;
};

const BrandTextContext = createContext<BrandTextContextValue | null>(null);

type BrandTextProviderProps = {
	children: ReactNode;
	companyName: string | null | undefined;
	additionalPlaceholders?: Record<string, string | null | undefined>;
};

/**
 * Provider that automatically replaces placeholders in text throughout the component tree.
 *
 * @example
 * ```tsx
 * <BrandTextProvider companyName="Acme Corp">
 *   <YourComponent />
 * </BrandTextProvider>
 * ```
 */
export function BrandTextProvider({
	children,
	companyName,
	additionalPlaceholders = {},
}: BrandTextProviderProps) {
	const replace = useMemo<PlaceholderReplacer>(() => {
		return (text: string | null | undefined): string => {
			if (!text) {
				return "";
			}

			let result = text;

			// Replace {company_name} placeholder
			if (companyName) {
				result = result.replace(/{company_name}/g, companyName);
			}

			// Replace additional placeholders
			for (const [key, placeholderValue] of Object.entries(
				additionalPlaceholders
			)) {
				if (placeholderValue) {
					const placeholder = `{${key}}`;
					result = result.replace(
						new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
						placeholderValue
					);
				}
			}

			return result;
		};
	}, [companyName, additionalPlaceholders]);

	const value = useMemo<BrandTextContextValue>(
		() => ({
			replace,
			companyName,
		}),
		[replace, companyName]
	);

	return (
		<BrandTextContext.Provider value={value}>
			{children}
		</BrandTextContext.Provider>
	);
}

/**
 * Hook to access the brand text replacement function.
 * Returns a function that automatically replaces placeholders in text.
 *
 * @example
 * ```tsx
 * const { replace } = useBrandText();
 * const processedText = replace("Welcome to {company_name}!");
 * ```
 */
export function useBrandText(): BrandTextContextValue {
	const context = useContext(BrandTextContext);
	if (!context) {
		// Return a no-op function if context is not available
		return {
			replace: (text: string | null | undefined) => text ?? "",
			companyName: null,
		};
	}
	return context;
}

type BrandTextProps<T extends ElementType = "span"> = {
	children: string | null | undefined;
	className?: string;
	as?: T;
} & Omit<ComponentProps<T>, "children" | "className" | "as">;

/**
 * Component that automatically replaces placeholders in its children text.
 *
 * @example
 * ```tsx
 * <BrandText>{data.tagline}</BrandText>
 * <BrandText as="p" className="text-lg">{data.mission}</BrandText>
 * ```
 */
export function BrandText<T extends ElementType = "span">({
	children,
	className,
	as,
	...props
}: BrandTextProps<T>) {
	const { replace } = useBrandText();
	const Component = (as ?? "span") as ElementType;
	const processedText = replace(children ?? "");

	return (
		<Component className={className} {...(props as ComponentProps<T>)}>
			{processedText}
		</Component>
	);
}
