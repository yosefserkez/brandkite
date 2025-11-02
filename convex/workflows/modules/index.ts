import { v } from "convex/values";

/**
 * Single source of truth for brand module types
 * Add new module types here and they'll be available everywhere
 */
export const BRAND_MODULE_TYPES = [
	"team",
	"customer",
	"product",
	"market",
	"business",
	"brandContext",
	"name",
	"tagline",
	"mission",
	"vision",
	"values",
	"purpose",
	"personas",
	"positioning",
	"tone",
	"promise",
	"narratives",
	"personality",
	"differentiators",
	"colors",
	"typography",
	"imagery",
	"logo",
	"voice",
	"story",
] as const;

/**
 * TypeScript type for brand module types.
 * Can be used in both frontend and backend
 */
export type BrandModuleType = (typeof BRAND_MODULE_TYPES)[number];

/**
 * Helper function to convert lowercase string to PascalCase
 */
function toPascalCase(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Enum-like object for brand module types
 * Automatically generated from BRAND_MODULE_TYPES
 * Usage: BrandModuleTypes.Name, BrandModuleTypes.Vision, etc.
 * Can be used in both frontend and backend
 */
export const BrandModuleTypes = Object.fromEntries(
	BRAND_MODULE_TYPES.map((type) => [toPascalCase(type), type])
) as Record<string, BrandModuleType> & {
	[K in BrandModuleType as `${Capitalize<K>}`]: K;
};

/**
 * Convex validator for brand module types
 * Automatically generated from BRAND_MODULE_TYPES
 * Can only be used in Convex functions (backend)
 */
export const brandModuleTypeValidator = v.union(
	...(BRAND_MODULE_TYPES.map((type) => v.literal(type)) as [
		ReturnType<typeof v.literal<BrandModuleType>>,
		...ReturnType<typeof v.literal<BrandModuleType>>[],
	])
);
