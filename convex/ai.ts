import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { brandModuleSchemas } from './brandModuleSchemas'

export const generateBrandModule = internalAction({
  args: {
    companyDescription: v.string(),
    moduleType: v.string(),
    existingModules: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const existingData = args.existingModules.reduce((acc, module) => {
      acc[module.type] = module.data;
      return acc;
    }, {} as Record<string, any>);

    const prompts = {
      foundations: `Create brand foundations for a company described as: "${args.companyDescription}"

Generate a comprehensive brand foundation with:
- Brand name (if not clear from description, suggest one)
- Tagline (memorable, 3-7 words)
- Mission statement (what we do)
- Vision statement (what we aspire to be)
- Core values (3-5 key principles)
- Brand purpose (why we exist)
- Target personas (2-3 detailed customer profiles)
- Brand positioning (unique market position)
- Tone of voice (personality traits)
- Brand promise (what customers can expect)
- Key narratives (3-4 story themes)
- Brand personality (human characteristics)
- Key differentiators (what sets us apart)`,

      visual: `Create visual identity for: "${args.companyDescription}"
${existingData.foundations ? `Brand foundations: ${JSON.stringify(existingData.foundations)}` : ''}

Generate visual identity with:
- Logo concepts (3 different directions with descriptions)
- Color palette (primary, secondary, accent colors with hex codes)
- Typography (primary and secondary font recommendations)
- Imagery style (photography/illustration direction)
- Iconography style (icon approach and style)
- Patterns and textures (design elements)
- Layout principles (grid, spacing, composition)
- Motion guidelines (animation principles)
- Usage rules (do's and don'ts)`,

      verbal: `Create verbal identity for: "${args.companyDescription}"
${existingData.foundations ? `Brand foundations: ${JSON.stringify(existingData.foundations)}` : ''}

Generate verbal identity with:
- Brand voice (personality in communication)
- Writing principles (style guidelines)
- Brand story (compelling narrative)
- Naming conventions (how we name things)
- Microcopy examples (UI text, buttons, messages)
- Tone variations (formal, casual, technical contexts)
- Messaging hierarchy (primary, secondary messages)
- Content pillars (key topics we discuss)`,

      applications: `Create brand applications for: "${args.companyDescription}"
${existingData.foundations ? `Foundations: ${JSON.stringify(existingData.foundations)}` : ''}
${existingData.visual ? `Visual: ${JSON.stringify(existingData.visual)}` : ''}
${existingData.verbal ? `Verbal: ${JSON.stringify(existingData.verbal)}` : ''}

Generate applications with:
- Collateral (business cards, letterhead, brochures)
- Website (homepage, key pages, components)
- Social media (profile templates, post formats)
- Email (templates, signatures, newsletters)
- Packaging (if applicable, design approach)
- Merchandise (branded items, apparel)
- Presentations (slide templates, formats)
- Digital assets (banners, ads, graphics)`,

      governance: `Create brand governance for: "${args.companyDescription}"
${existingData.foundations ? `Foundations: ${JSON.stringify(existingData.foundations)}` : ''}

Generate governance with:
- Version control (how we track changes)
- Style guide structure (organization of guidelines)
- Asset library (file organization, naming)
- Access rules (who can edit what)
- Approval process (review and sign-off workflow)
- Consistency checks (quality assurance)
- Brand guidelines (comprehensive rulebook)
- Training materials (onboarding resources)`
    };

    const schemas = brandModuleSchemas;

    const prompt = prompts[args.moduleType as keyof typeof prompts];
    const schema = schemas[args.moduleType as keyof typeof schemas];
    
    if (!prompt || !schema) throw new Error("Invalid module type");

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: "You are a brand strategist and designer. Generate comprehensive, professional brand content.",
      schema,
      schemaName: `Brand${args.moduleType.charAt(0).toUpperCase() + args.moduleType.slice(1)}`,
      prompt,
      temperature: 0.7,
    });

    return object;
  },
});

export const generateInitialBrand = internalAction({
  args: {
    companyId: v.id("companies"),
    description: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const moduleTypes = ["foundations", "visual", "verbal", "applications", "governance"];
    
    for (const moduleType of moduleTypes) {
      const existingModules = await ctx.runQuery(internal.brandModules.getModulesForGeneration, {
        companyId: args.companyId,
      });

      const generatedData = await ctx.runAction(internal.ai.generateBrandModule, {
        companyDescription: args.description,
        moduleType,
        existingModules,
      });

      await ctx.runMutation(internal.brandModules.updateModuleInternal, {
        companyId: args.companyId,
        type: moduleType as any,
        data: generatedData,
      });
    }
  },
});
