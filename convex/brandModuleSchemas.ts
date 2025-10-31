import { z } from 'zod'

// Zod schemas for each module type
export const foundationsSchema = z.object({
  name: z.string().describe("Brand name"),
  tagline: z.string().describe("Memorable tagline, 3-7 words"),
  mission: z.string().describe("Mission statement - what we do"),
  vision: z.string().describe("Vision statement - what we aspire to be"),
  values: z.array(z.string()).describe("Core values - 3-5 key principles"),
  purpose: z.string().describe("Brand purpose - why we exist"),
  personas: z.array(z.object({
    name: z.string(),
    description: z.string(),
    characteristics: z.array(z.string()).optional(),
  })).describe("Target personas - 2-3 detailed customer profiles"),
  positioning: z.string().describe("Unique market position"),
  tone: z.string().describe("Tone of voice - personality traits"),
  promise: z.string().describe("Brand promise - what customers can expect"),
  narratives: z.array(z.string()).describe("Key narratives - 3-4 story themes"),
  personality: z.string().describe("Brand personality - human characteristics"),
  differentiators: z.array(z.string()).describe("Key differentiators - what sets us apart"),
});

export const visualSchema = z.object({
  logos: z.array(z.object({
    direction: z.string(),
    description: z.string(),
    concept: z.string(),
  })).describe("Logo concepts - 3 different directions with descriptions"),
  colors: z.object({
    primary: z.object({
      name: z.string(),
      hex: z.string(),
    }),
    secondary: z.object({
      name: z.string(),
      hex: z.string(),
    }),
    accent: z.object({
      name: z.string(),
      hex: z.string(),
    }).optional(),
    additional: z.array(z.object({
      name: z.string(),
      hex: z.string(),
    })).optional(),
  }).describe("Color palette - primary, secondary, accent colors with hex codes"),
  typography: z.object({
    primary: z.object({
      font: z.string(),
      description: z.string().optional(),
    }),
    secondary: z.object({
      font: z.string(),
      description: z.string().optional(),
    }),
  }).describe("Typography - primary and secondary font recommendations"),
  imagery: z.string().describe("Imagery style - photography/illustration direction"),
  iconography: z.string().describe("Iconography style - icon approach and style"),
  patterns: z.string().describe("Patterns and textures - design elements"),
  layouts: z.string().describe("Layout principles - grid, spacing, composition"),
  motion: z.string().describe("Motion guidelines - animation principles"),
  usage: z.object({
    dos: z.array(z.string()),
    donts: z.array(z.string()),
  }).describe("Usage rules - do's and don'ts"),
});

export const verbalSchema = z.object({
  voice: z.string().describe("Brand voice - personality in communication"),
  principles: z.array(z.string()).describe("Writing principles - style guidelines"),
  story: z.string().describe("Brand story - compelling narrative"),
  naming: z.string().describe("Naming conventions - how we name things"),
  microcopy: z.array(z.object({
    context: z.string(),
    example: z.string(),
  })).describe("Microcopy examples - UI text, buttons, messages"),
  toneVariations: z.object({
    formal: z.string().optional(),
    casual: z.string().optional(),
    technical: z.string().optional(),
  }).describe("Tone variations - formal, casual, technical contexts"),
  messaging: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
  }).describe("Messaging hierarchy - primary, secondary messages"),
  contentPillars: z.array(z.string()).describe("Content pillars - key topics we discuss"),
});

export const applicationsSchema = z.object({
  collateral: z.string().describe("Collateral - business cards, letterhead, brochures"),
  website: z.string().describe("Website - homepage, key pages, components"),
  social: z.string().describe("Social media - profile templates, post formats"),
  email: z.string().describe("Email - templates, signatures, newsletters"),
  packaging: z.string().optional().describe("Packaging - if applicable, design approach"),
  merchandise: z.string().describe("Merchandise - branded items, apparel"),
  presentations: z.string().describe("Presentations - slide templates, formats"),
  digital: z.string().describe("Digital assets - banners, ads, graphics"),
});

export const governanceSchema = z.object({
  versioning: z.string().describe("Version control - how we track changes"),
  styleGuide: z.string().describe("Style guide structure - organization of guidelines"),
  assetLibrary: z.string().describe("Asset library - file organization, naming"),
  access: z.string().describe("Access rules - who can edit what"),
  approvals: z.string().describe("Approval process - review and sign-off workflow"),
  consistency: z.string().describe("Consistency checks - quality assurance"),
  guidelines: z.string().describe("Brand guidelines - comprehensive rulebook"),
  training: z.string().describe("Training materials - onboarding resources"),
});

// TypeScript types derived from Zod schemas
export type FoundationsData = z.infer<typeof foundationsSchema>;
export type VisualData = z.infer<typeof visualSchema>;
export type VerbalData = z.infer<typeof verbalSchema>;
export type ApplicationsData = z.infer<typeof applicationsSchema>;
export type GovernanceData = z.infer<typeof governanceSchema>;

export type BrandModuleData = 
  | FoundationsData 
  | VisualData 
  | VerbalData 
  | ApplicationsData 
  | GovernanceData;

// Schema map for easy access
export const brandModuleSchemas = {
  foundations: foundationsSchema,
  visual: visualSchema,
  verbal: verbalSchema,
  applications: applicationsSchema,
  governance: governanceSchema,
} as const;

