/**
 * Utility to convert Zod schemas to Convex validators
 *
 * This helps avoid duplication when using both Zod (for AI schema validation)
 * and Convex validators (for function arguments).
 *
 * Note: This covers common cases but may not support all Zod features.
 * This uses Zod's internal `_def` API which is not officially supported.
 */

import { v } from "convex/values";
import type { z } from "zod";

type AnyZodType = z.ZodTypeAny;

// Helper type to get the internal _def shape
type ZodDef = {
	typeName: string;
	value?: unknown;
	type?: AnyZodType;
	shape?: () => Record<string, AnyZodType>;
	innerType?: AnyZodType;
	options?: AnyZodType[];
	keyType?: AnyZodType;
	valueType?: AnyZodType;
	schema?: AnyZodType;
};

/**
 * Converts a Zod schema to a Convex validator
 *
 * @example
 * const zodSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.string().optional(),
 * });
 *
 * const convexValidator = zodToConvex(zodSchema);
 * // Use in Convex function: args: { data: convexValidator }
 */
// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
export function zodToConvex(schema: AnyZodType): any {
	const zodDef = (schema._def ?? {}) as unknown as ZodDef;
	const zodType = zodDef.typeName;

	return convertZodType(zodType, zodDef);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertZodType(zodType: string, zodDef: ZodDef): any {
	// Primitive types
	if (zodType === "ZodString") {
		return v.string();
	}
	if (zodType === "ZodNumber") {
		return v.number();
	}
	if (zodType === "ZodBigInt") {
		return v.bigint();
	}
	if (zodType === "ZodBoolean") {
		return v.boolean();
	}
	if (zodType === "ZodNull") {
		return v.null();
	}
	if (zodType === "ZodAny") {
		return v.any();
	}

	return convertComplexType(zodType, zodDef);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertComplexType(zodType: string, zodDef: ZodDef): any {
	// Literal type
	if (zodType === "ZodLiteral") {
		return convertLiteral(zodDef);
	}

	// Array type
	if (zodType === "ZodArray") {
		return convertArray(zodDef);
	}

	// Object type
	if (zodType === "ZodObject") {
		return convertObject(zodDef);
	}

	// Optional type
	if (zodType === "ZodOptional") {
		return convertOptional(zodDef);
	}

	// Nullable type
	if (zodType === "ZodNullable") {
		return convertNullable(zodDef);
	}

	// Union type
	if (zodType === "ZodUnion") {
		return convertUnion(zodDef);
	}

	// Record type
	if (zodType === "ZodRecord") {
		return convertRecord(zodDef);
	}

	// Default type (ignore default value, use inner type)
	if (zodType === "ZodDefault") {
		return convertDefault(zodDef);
	}

	// Effects/Refined/Transformer (use inner schema, lose validations)
	const isEffect =
		zodType === "ZodEffects" ||
		zodType === "ZodRefined" ||
		zodType === "ZodTransformer";
	if (isEffect) {
		return convertEffects(zodDef);
	}

	throw new Error(
		`Unsupported Zod type: ${zodType}. Please add support or use Convex validators directly for this type.`
	);
}

// Helper functions to reduce complexity

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertLiteral(zodDef: ZodDef): any {
	const value = zodDef.value;
	// Ensure value is a valid literal type
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "bigint" ||
		typeof value === "boolean"
	) {
		return v.literal(value);
	}
	throw new Error(`Invalid literal value type: ${typeof value}`);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertArray(zodDef: ZodDef): any {
	const elementSchema = zodDef.type;
	if (!elementSchema) {
		throw new Error("Array schema missing element type");
	}
	return v.array(zodToConvex(elementSchema));
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertObject(zodDef: ZodDef): any {
	const shapeGetter = zodDef.shape;
	if (!shapeGetter) {
		throw new Error("Object schema missing shape");
	}
	const shape = shapeGetter();
	// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
	const convexShape: Record<string, any> = {};

	for (const [key, value] of Object.entries(shape)) {
		convexShape[key] = zodToConvex(value);
	}

	return v.object(convexShape);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertOptional(zodDef: ZodDef): any {
	const innerSchema = zodDef.innerType;
	if (!innerSchema) {
		throw new Error("Optional schema missing inner type");
	}
	return v.optional(zodToConvex(innerSchema));
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertNullable(zodDef: ZodDef): any {
	// Convex doesn't have a direct nullable, so we use a union
	const innerSchema = zodDef.innerType;
	if (!innerSchema) {
		throw new Error("Nullable schema missing inner type");
	}
	return v.union(zodToConvex(innerSchema), v.null());
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertUnion(zodDef: ZodDef): any {
	const options = zodDef.options;
	if (!options) {
		throw new Error("Union schema missing options");
	}
	const convexOptions = options.map((opt) => zodToConvex(opt));
	return v.union(...convexOptions);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertRecord(zodDef: ZodDef): any {
	const keySchema = zodDef.keyType;
	const valueSchema = zodDef.valueType;

	if (!keySchema) {
		throw new Error("Record schema missing key type");
	}
	if (!valueSchema) {
		throw new Error("Record schema missing value type");
	}

	// Convex records only support string keys
	const keyDef = (keySchema._def ?? {}) as unknown as ZodDef;
	if (keyDef.typeName !== "ZodString") {
		throw new Error("Convex records only support string keys");
	}

	return v.record(zodToConvex(keySchema), zodToConvex(valueSchema));
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertDefault(zodDef: ZodDef): any {
	// Convex doesn't have defaults, so we use the inner type
	const innerSchema = zodDef.innerType;
	if (!innerSchema) {
		throw new Error("Default schema missing inner type");
	}
	return zodToConvex(innerSchema);
}

// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
function convertEffects(zodDef: ZodDef): any {
	// For refined/transformed schemas, use the inner schema
	// Note: Validations/transformations are lost in conversion
	const innerSchema = zodDef.schema;
	if (!innerSchema) {
		throw new Error("Effects/Refined/Transformer schema missing inner schema");
	}
	return zodToConvex(innerSchema);
}

/**
 * Helper to extract just the shape from a Zod object schema for easier inline use
 *
 * @example
 * const documentSchema = z.object({
 *   name: z.string().optional(),
 *   summary: z.string(),
 * });
 *
 * // Instead of manually writing:
 * // v.object({ name: v.optional(v.string()), summary: v.string() })
 *
 * // Use:
 * const convexArgs = {
 *   documents: v.array(zodToConvexObject(documentSchema))
 * };
 */
// biome-ignore lint/suspicious/noExplicitAny: Convex validators use any for flexibility
export function zodToConvexObject(schema: z.ZodObject<z.ZodRawShape>): any {
	return zodToConvex(schema);
}
