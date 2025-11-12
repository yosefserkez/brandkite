import type { z } from "zod";
import { brandContextSchema } from "../modules/brandContext";
import { colorsSchema } from "../modules/colors";
import { logoSchema } from "../modules/logo";
import { nameSchema } from "../modules/name";
import { missionSchema } from "../modules/mission";
import { storySchema } from "../modules/story";
import { toneSchema } from "../modules/tone";
import { taglineSchema } from "../modules/tagline";
import { typographySchema } from "../modules/typography";
import type { BrandModuleType } from "../workflows";

/**
 * Registry of Zod schemas for brand module types.
 * Convention: Each module type maps to its corresponding schema export.
 * - Module file: `modules/{moduleType}.ts` (camelCase)
 * - Schema export: `{moduleType}Schema` (camelCase + "Schema")
 *
 * To add a new module type:
 * 1. Create `modules/{moduleType}.ts` with a `{moduleType}Schema` export
 * 2. Import and add it to this registry
 */
const BRAND_MODULE_SCHEMAS: Partial<Record<BrandModuleType, z.ZodType>> = {
	brandContext: brandContextSchema,
	colors: colorsSchema,
	name: nameSchema,
	logo: logoSchema,
	mission: missionSchema,
	tagline: taglineSchema,
	story: storySchema,
	tone: toneSchema,
	typography: typographySchema,
};

export const getBrandModuleDataValidator = (
	type: BrandModuleType | undefined | null
) => {
	if (!type) {
		return null;
	}
	return BRAND_MODULE_SCHEMAS[type] ?? null;
};

export const validateBrandModuleData = (
	data: unknown,
	type: BrandModuleType | undefined | null
): z.ZodError | null => {
	const schema = getBrandModuleDataValidator(type);
	if (!schema) {
		return null;
	}
	const result = schema.safeParse(data);
	return result.success ? null : result.error;
};
