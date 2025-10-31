import { v } from "convex/values";

// Export all workflow modules for automatic registration
export { LogoWorkflow } from './logo';
export { NameWorkflow } from './name';
export { TaglineWorkflow } from './tagline';
export { MissionWorkflow } from './mission';
export { VisionWorkflow } from './vision';
export { ValuesWorkflow } from './values';
export { PurposeWorkflow } from './purpose';
export { PersonasWorkflow } from './personas';
export { PositioningWorkflow } from './positioning';
export { ToneWorkflow } from './tone';
export { PromiseWorkflow } from './promise';
export { NarrativesWorkflow } from './narratives';
export { PersonalityWorkflow } from './personality';
export { DifferentiatorsWorkflow } from './differentiators';
export { ColorsWorkflow } from './colors';
export { TypographyWorkflow } from './typography';
export { ImageryWorkflow } from './imagery';
export { VoiceWorkflow } from './voice';
export { StoryWorkflow } from './story';

/**
 * Single source of truth for brand module types
 * Add new module types here and they'll be available everywhere
 */
export const BRAND_MODULE_TYPES = [
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
  "logos",
  "voice",
  "story",
] as const;

/**
 * TypeScript type for brand module types.
 * Can be used in both frontend and backend
 */
export type BrandModuleType = typeof BRAND_MODULE_TYPES[number];

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
    ...ReturnType<typeof v.literal<BrandModuleType>>[]
  ])
);