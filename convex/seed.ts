import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	type ActionCtx,
	internalAction,
	internalMutation,
} from "./_generated/server";
import type { BrandContext } from "./modules/brandContext";
import type { BrandPalette } from "./modules/colors";
import type { LogoModuleData } from "./modules/logo";
import type { BrandMission } from "./modules/mission";
import type { NameModuleData } from "./modules/name";
import type { BrandStory } from "./modules/story";
import type { BrandTagline } from "./modules/tagline";
import type { BrandTone } from "./modules/tone";
import { r2 } from "./r2";
import { BrandModuleTypes } from "./workflows";

const SVG_MIME_TYPE = "image/svg+xml";
const ADMIN_EMAIL = "brandkite@brandkite.co";
const ADMIN_NAME = "Brandkite";

/**
 * Seeds a public company called "Brandkite" with all modules mocked
 */
export default internalAction({
	handler: async (ctx: ActionCtx): Promise<void> => {
		const now = Date.now();

		// Find or create admin user
		const adminUserId: Id<"users"> = await ctx.runMutation(
			internal.seed.findOrCreateAdminUser
		);

		const logoSvgContent = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" style="display: block;" viewBox="0 0 1396 1544" width="349" height="386" preserveAspectRatio="none">
<path transform="translate(0,0)" fill="rgb(0,0,0)" d="M 1112.62 47.4274 L 1113.71 48.0458 C 1117.38 53.2871 1142.51 154.957 1145.5 166.455 C 1201.77 386.751 1256.86 607.347 1310.76 828.235 C 1328.29 898.927 1344.49 974.423 1363.13 1044.19 C 1356.99 1045.58 1331.56 1055.8 1323.9 1058.71 L 1242.57 1089.27 L 942.167 1200.14 L 371.579 1406.9 L 179.647 1476.89 C 146.098 1489.12 103.865 1503.21 71.7922 1516.75 C 82.7422 1499.02 98.1064 1478.13 110.288 1460.9 L 184.084 1357.52 L 409.835 1041.11 L 634.549 725.488 C 689.18 647.069 744.459 569.104 800.381 491.6 C 817.002 500.752 862.954 536.44 879.393 549.158 C 963.587 614.047 1043.17 684.711 1117.56 760.638 C 1154.8 797.743 1190.57 836.283 1224.81 876.17 C 1251.79 907.843 1278.37 939.856 1304.54 972.202 C 1318.19 989.393 1339.3 1020.05 1353.97 1033.63 C 1338.76 1002.2 1313.53 962.986 1294.32 933.936 C 1187.2 774.018 1055.5 632.018 904.086 513.183 C 880.615 494.836 850.81 471.537 825.997 455.208 C 835.833 442.294 848.393 422.823 858.313 408.788 C 883.575 373.542 908.647 338.16 933.529 302.644 L 1036.6 156.293 C 1061.84 120.49 1088.32 83.8247 1112.62 47.4274 z"/>
<path transform="translate(0,0)" fill="rgb(0,0,0)" d="M 1074.98 20.6503 L 1075.43 20.9162 C 1075.73 24.3855 1069 32.7993 1066.66 36.1424 C 1046.75 64.5633 1026.51 92.7478 1006.47 121.078 L 789.059 429.183 C 729.94 389.821 668.886 353.448 606.126 320.2 C 509.432 270.21 408.283 229.354 303.995 198.162 C 237.516 178.075 157.156 159.053 88.1666 152.622 C 109.38 161.836 147.609 170.429 171.166 177.965 C 206.565 189.289 240.558 201.068 275.469 213.83 C 401.54 260.375 523.129 318.258 638.743 386.769 C 678.575 410.185 726.122 439.271 763.493 466.264 C 754.728 476.588 739.197 499.887 730.932 511.531 L 659.057 613.897 L 425.369 943.89 C 409.089 967.966 390.156 993.464 373.233 1017.38 L 210.36 1244.86 L 105.276 1391.12 L 60.8044 1452.78 C 50.1168 1467.61 39.6027 1483.02 28.0065 1497.08 L 42.714 929.781 L 58.071 378.721 C 60.5942 299.602 62.5756 220.466 64.015 141.32 C 108.825 134.817 157.045 130.243 202.41 124.66 L 571.359 80.5077 L 909.923 40.5565 C 963.726 34.1846 1021.45 25.5299 1074.98 20.6503 z"/>
</svg>`;

		// Upload logo SVG to R2
		const logoBytes = new TextEncoder().encode(logoSvgContent);
		const logoStorageKey = await r2.store(ctx, logoBytes, {
			type: SVG_MIME_TYPE,
		});

		// Create the company
		const companyId: Id<"companies"> = await ctx.runMutation(
			internal.seed.createInternal,
			{
				name: "Brandkite",
				description: "A modern brand identity platform",
				ownerId: adminUserId,
				isPublic: true,
				createdAt: now,
				updatedAt: now,
			}
		);

		// Create brand context module
		const brandContext: BrandContext = {
			industry: "Brand Identity & Design",
			summary:
				"Brandkite is a modern brand identity platform that helps companies create, manage, and evolve their brand identity. We combine AI-powered generation with human creativity to deliver comprehensive brand systems including names, logos, colors, typography, and messaging. Our platform serves startups, agencies, and established companies looking to build or refresh their brand presence.",
			team: {
				summary:
					"A passionate team of one, dedicated to making brand identity accessible.",
				members: [
					{
						name: "Yosef Serkez",
						summary: "Creator, Brandkite",
						url: "https://yosefserkez.com",
						imageUrl: "",
						role: "Founder",
					},
				],
			},
			product: {
				summary:
					"An AI-powered brand identity platform that generates comprehensive brand systems including names, logos, color palettes, typography, messaging, and brand guidelines. Users provide context about their business, and Brandkite generates multiple options with detailed reasoning and implementation guidance.",
			},
			market: {
				summary:
					"Serving the growing market of startups, agencies, and companies seeking professional brand identity solutions. The market includes traditional agencies (expensive, slow), DIY tools (limited quality), and emerging AI tools (fragmented offerings). Brandkite positions itself as the comprehensive, AI-enhanced solution that combines speed, quality, and affordability.",
				competitors: [
					{
						name: "Canva",
						summary:
							"DIY design platform with basic brand kit features, targeting non-designers",
						url: "https://canva.com",
						imageUrl: "",
					},
					{
						name: "Looka",
						summary: "AI logo generator with limited brand system capabilities",
						url: "https://looka.com",
						imageUrl: "",
					},
					{
						name: "Brand New",
						summary:
							"Traditional brand identity agency, high-end but expensive and slow",
						url: "https://underconsideration.com/brandnew",
						imageUrl: "",
					},
				],
			},
			customer: {
				summary:
					"Primary customers are startup founders, marketing teams at growing companies, and design agencies. They value speed, quality, and comprehensive solutions. They typically have limited budgets but need professional results. Decision-makers are often non-designers who need guidance and confidence in their brand choices.",
			},
			brand: {
				summary:
					"Brandkite embodies modern, approachable professionalism. The brand voice is confident yet accessible, innovative yet practical. Visual identity leans toward clean minimalism with thoughtful details. Personality traits include: creative, reliable, empowering, and forward-thinking. The brand wants to be seen as the smart, modern choice for brand identity.",
				inspirations: [
					{
						name: "Stripe",
						summary:
							"Clean, developer-friendly aesthetic with attention to detail",
						url: "https://stripe.com",
						imageUrl: "",
					},
					{
						name: "Linear",
						summary:
							"Minimal, focused design with strong typography and purposeful use of color",
						url: "https://linear.app",
						imageUrl: "",
					},
					{
						name: "Figma",
						summary:
							"Playful yet professional, approachable design tool aesthetic",
						url: "https://figma.com",
						imageUrl: "",
					},
				],
			},
			business: {
				summary:
					"Subscription-based SaaS model with tiered pricing. Revenue streams include monthly/annual subscriptions for individuals and teams, plus enterprise custom solutions. Go-to-market focuses on content marketing, partnerships with startup accelerators, and word-of-mouth from satisfied customers. Key metrics include customer acquisition cost, lifetime value, and module generation usage.",
			},
			documents: [],
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.BrandContext,
			data: brandContext,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create name module
		const nameModule: NameModuleData = [
			{
				name: {
					name: "Brandkite",
					reasoning: {
						summary:
							"Brandkite combines 'brand' with 'kite' suggesting elevation, freedom, and the ability to soar with your brand identity.",
						details:
							"The name Brandkite evokes the idea of launching and elevating a brand. 'Kite' suggests freedom, playfulness, and the ability to reach new heights. It's memorable, distinctive, and positions the brand as an empowering tool that helps companies take flight. The name is modern, approachable, and works well for a tech-forward brand identity platform.",
					},
				},
				domains: ["brandkite.com", "brandkite.io", "brandkite.app"],
			},
		];

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Name,
			data: nameModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create logo module
		const logoModule: LogoModuleData = {
			storageKey: logoStorageKey,
			prompt:
				"Minimal rounded geometric emblem for a brand identity platform. Concept: button, circular form. Solid black on transparent. Smooth balance, soft curves, open negative space, circular symmetry, gentle flow, organic continuity.",
			model: "manual-seed",
			generatedAt: now,
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Logo,
			data: logoModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create tagline module
		const taglineModule: BrandTagline = {
			tagline: "Elevate your brand identity",
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Tagline,
			data: taglineModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create mission module
		const missionModule: BrandMission = {
			mission:
				"We empower companies to build authentic, compelling brand identities that resonate with their audience and drive meaningful connections.",
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Mission,
			data: missionModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create tone module
		const toneModule: BrandTone = {
			summary:
				"Brandkite's voice is confident yet approachable, innovative yet practical. We speak with clarity and purpose, avoiding jargon while demonstrating expertise. Our tone empowers users to make informed decisions about their brand identity.",
			examples: [
				{
					title: "Clear and Confident",
					description:
						"We explain complex brand concepts in simple terms, giving users the confidence to make decisions.",
					context: "Product messaging and feature descriptions",
				},
				{
					title: "Empowering and Supportive",
					description:
						"We guide users through their brand journey with encouragement and practical advice.",
					context: "Onboarding flows and help documentation",
				},
				{
					title: "Professional yet Approachable",
					description:
						"We maintain professionalism while remaining accessible and human in our communication.",
					context: "Marketing materials and customer communications",
				},
			],
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Tone,
			data: toneModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create story module
		const storyModule: BrandStory = {
			story: `Every company starts with an idea, but turning that idea into a recognizable brand? That's where most founders get stuck. Traditional agencies are expensive and slow. DIY tools leave you guessing. And most AI tools only solve one piece of the puzzle.

Brandkite was born from this frustration. We saw founders spending weeks—sometimes months—trying to piece together a brand identity from fragmented tools and services. They needed something better: a platform that could generate comprehensive brand systems quickly, intelligently, and affordably.

Today, Brandkite helps companies of all sizes build authentic brand identities. From startups launching their first product to established companies refreshing their look, we provide the tools and guidance to create brands that truly resonate. Your brand identity shouldn't be a barrier—it should be your launchpad.`,
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Story,
			data: storyModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create colors module
		const colorsModule: BrandPalette = {
			overview:
				"Brandkite's color palette balances modern professionalism with approachable warmth. The deep anchor color provides stability and trust, while the vibrant accent adds energy and innovation. The neutral support ensures versatility across all applications.",
			howToUse:
				"Use the anchor color for primary actions and key elements. The accent color highlights important features and calls-to-action. The neutral works for backgrounds, text, and subtle UI elements. Maintain sufficient contrast for accessibility.",
			colors: [
				{
					name: "Deep Anchor",
					role: "Primary anchor",
					hex: "#1A1A1A",
					summary:
						"This deep near-black serves as the foundation, conveying professionalism and reliability.",
					usage:
						"Primary buttons, key text, and important UI elements. Use for maximum contrast and emphasis.",
				},
				{
					name: "Vibrant Accent",
					role: "Supportive accent",
					hex: "#0066FF",
					summary:
						"A modern blue that represents innovation and trust, energizing the palette without overwhelming.",
					usage:
						"Call-to-action buttons, links, and interactive elements. Use sparingly for maximum impact.",
				},
				{
					name: "Warm Neutral",
					role: "Warm neutral",
					hex: "#F5F5F5",
					summary:
						"A soft, warm gray that provides breathing room and maintains readability across contexts.",
					usage:
						"Backgrounds, cards, and subtle UI elements. Ensures comfortable reading and visual hierarchy.",
				},
			],
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Colors,
			data: colorsModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Create typography module
		const typographyModule = {
			overview:
				"Brandkite's typography system prioritizes clarity and modern professionalism. The primary font provides excellent readability for body text, while the headline font adds character and visual interest. Together, they create a cohesive system that feels both approachable and authoritative.",
			guidelines: [
				"Maintain a minimum font size of 16px for body text to ensure readability",
				"Use the headline font for headings H1-H3, reserve body font for H4 and below",
				"Maintain line height of 1.5-1.6 for body text, 1.2-1.3 for headlines",
				"Limit headline font to 2-3 font weights to maintain consistency",
			],
			primaryFont: {
				name: "Inter",
				summary:
					"Inter is a versatile, modern sans-serif that provides excellent readability across all devices. Its geometric construction and open letterforms align perfectly with {company_name}'s clean, professional aesthetic.",
				usage:
					"Body text, UI elements, forms, and any text requiring extended reading. Use for paragraphs, lists, and supporting content.",
				pairing:
					"Pairs beautifully with the headline font for contrast while maintaining visual harmony.",
			},
			headlineFont: {
				name: "Poppins",
				summary:
					"Poppins brings character and warmth to headlines while maintaining excellent legibility. Its rounded terminals and friendly curves add personality without compromising professionalism.",
				usage:
					"Headings H1-H3, hero text, and any text that needs to command attention. Use sparingly for maximum impact.",
				pairing:
					"Complements Inter's geometric structure while adding visual interest through contrast.",
			},
			specimenCopy: "Brandkite is the smart, modern choice for brand identity.",
		};

		await ctx.runMutation(internal.brandModules.createModuleInternal, {
			companyId,
			type: BrandModuleTypes.Typography,
			data: typographyModule,
			publish: true,
			generationStatus: "succeeded",
		});

		// Update company name
		await ctx.runMutation(internal.companies.updateInternal, {
			companyId,
			name: "Brandkite",
		});
	},
});

// Internal mutation to create a company
export const createInternal = internalMutation({
	args: {
		name: v.string(),
		description: v.string(),
		ownerId: v.id("users"),
		isPublic: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	},
	handler: async (ctx, args): Promise<Id<"companies">> =>
		await ctx.db.insert("companies", args),
});

// Find or create admin user
export const findOrCreateAdminUser = internalMutation({
	args: {},
	handler: async (ctx): Promise<Id<"users">> => {
		// Try to find existing admin user by email
		const users = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), ADMIN_EMAIL))
			.first();

		if (users) {
			return users._id;
		}

		// Create new admin user
		const userId = await ctx.db.insert("users", {
			email: ADMIN_EMAIL,
			name: ADMIN_NAME,
		});

		return userId;
	},
});
