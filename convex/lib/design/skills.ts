// Design-skill prompt fragments, distilled to "right altitude": concrete
// enough to steer away from the statistical default, open enough to leave
// room for brand-specific judgment. Human-readable corpus + attribution for
// vendored ideas lives in design/skills/ (see design/skills/NOTICE.md).

export const BANNED_BUZZWORDS = [
	"revolutionary",
	"revolutionize",
	"seamless",
	"seamlessly",
	"unlock",
	"empower",
	"elevate",
	"supercharge",
	"turbocharge",
	"game-changer",
	"game-changing",
	"cutting-edge",
	"next-level",
	"world-class",
	"best-in-class",
	"state-of-the-art",
	"unleash",
	"synergy",
	"transformative",
	"frictionless",
	"streamline",
	"enterprise-grade",
	"next-generation",
] as const;

// ── Copy fragments ─────────────────────────────────────────────────────────

export const COPY_CRAFT = [
	"Copy craft:",
	"- Specific beats clever. Name the customer's actual situation, product's actual behavior, the concrete outcome.",
	"- Plain, declarative, human sentences. Every line earns its place.",
	`- Banned words (marketing slop): ${BANNED_BUZZWORDS.join(", ")}. No clichés.`,
	'- No AI cadence tells: at most one em-dash per piece, and never the aphorism pattern "Not a X. A Y."',
].join("\n");

export const NO_FABRICATION =
	"CRITICAL — never fabricate facts: no invented user counts, customer numbers, percentages, ratings, awards, or testimonials. Only cite a number or claim if it appears verbatim in the supplied brand context; otherwise make the case qualitatively.";

export const DISTINCTIVE_VOICE = [
	"Distinctiveness:",
	"- Write copy only this brand could publish. If a line would work for any competitor in the category, it is generic — replace it.",
	"- Derive the voice from the supplied brand context, not from category convention.",
	"- Take one deliberate, justifiable stylistic risk per piece; keep the rest disciplined.",
].join("\n");

export const HEADLINE_DIVERGENCE = [
	"Headline divergence — variants take materially different ANGLES (a different opening thought), never rewrites of one idea:",
	"- Angles: outcome-led ({outcome} without {pain}), pain-led (never {bad event} again), mechanism-led ({outcome} by {how}), identity-led (the {category} for {audience}), proof-led (only with a real number from the context), contrarian (the {opposite-of-usual} way to {outcome}).",
	"- Headlines <= 10 words (6-8 ideal); include the audience or their goal; specific beats clever.",
	"- If the variants could be swapped around without anyone noticing, they have failed.",
	'- CTA copy = action verb + what they get, first person ("Start my free trial"). Never: Submit, Sign Up, Learn More, Get Started, Click Here.',
].join("\n");

export const MESSAGE_HIERARCHY = [
	"Message hierarchy — decide before writing:",
	"- The single primary promise (the hero owns it), 2-4 supporting benefits that each survive 'so what?', and the ONE action the page asks for.",
	"- Hero headline <= 10 words containing the audience or their outcome; subheadline = {product} helps {audience} {outcome} by {mechanism}, with a concrete detail.",
	"- CTA = action verb + what they get, first person. Never: Submit, Sign Up, Learn More, Get Started.",
	"- Benefit sections are an argument in sequence, not an unordered feature list; every claim survives 'so what?' or gains a 'which means…' bridge.",
].join("\n");

// ── Visual fragments ───────────────────────────────────────────────────────

// AI visual output collapses to a few statistical defaults ("AI slop looks").
// Naming them is the most effective known counter (Anthropic frontend-design
// finding, independently validated with pairwise evals).
export const ANTI_DEFAULT_LOOKS = [
	"Avoid the known AI-default looks — these read as machine-generated:",
	"- The safe SaaS kit: indigo/violet primary on white, gray-500 body text, rounded-xl cards for everything.",
	"- Cream/beige background + high-contrast serif display + terracotta accent 'tasteful startup' look.",
	"- Near-black background + single acid-green or neon accent 'techno' look.",
	"- The oversized italic-serif hero (Fraunces/Recoleta/Playfair) with an uppercase eyebrow label above it.",
	"- Default fonts standing in for a decision: Inter/Roboto/Arial as the display face.",
	"If the brand context genuinely calls for one of these, push it somewhere specific to this brand instead of the generic version.",
].join("\n");

export const COLOR_CRAFT = [
	"Color craft:",
	"- The palette must be traceable to this brand's context — its industry reality, customer temperature, and personality — not to category convention.",
	"- Diverge deliberately from competitors' palettes; if the category defaults to blue, that is an opportunity, not a rule.",
	"- Practicality: colors must survive light and dark UI, print, and small sizes. At least one color must work as readable text on white.",
	"- No muddy midtones that die next to each other; ensure the three colors are clearly distinct in hue or value.",
].join("\n");

export const TYPOGRAPHY_CRAFT = [
	"Typography craft:",
	"- Typography carries the personality: choose a display face with a point of view and a workhorse text face that stays out of its way.",
	"- Never pick Inter, Roboto, Open Sans, Lato, Arial, or Helvetica as the headline/display font — those are defaults, not decisions. The same now goes for the overused 'distinctive' picks: Space Grotesk, Plus Jakarta Sans, Geist, Fraunces. (Workhorse faces are acceptable as the body/primary face when the pairing rationale says why.)",
	"- The pairing must have deliberate contrast: serif/sans, weight, or width — name the axis of contrast in the rationale.",
	"- Both fonts must be freely available (Google Fonts or web-safe) and legible in interfaces.",
].join("\n");

export const LOGO_CRAFT = [
	"Logo craft:",
	"- Encode exactly ONE idea, drawn from what the brand actually does or believes — not a generic abstract squiggle.",
	"- Prefer construction with intent: negative space, a grid, a repeated geometric motif. Confident, precise geometry.",
	"- Must survive: 16px favicon, single color, inverted on dark. If it needs color or size to read, it fails.",
	"- Avoid category clichés (chat bubbles for messaging, leaves for eco, rockets for startups, generic swooshes and globes).",
].join("\n");

// ── Composition helper ─────────────────────────────────────────────────────

export const composeSystem = (
	persona: string,
	...fragments: string[]
): string => [persona, ...fragments].join("\n\n");
