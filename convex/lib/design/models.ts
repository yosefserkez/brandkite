import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Central model routing for all generation. Swap models here, not per-module.
// Roles let Phase B introduce a vision critic without touching call sites.
export const TEXT_MODEL = "x-ai/grok-4.3";
export const SVG_MODEL = "x-ai/grok-4.3";

let client: ReturnType<typeof createOpenRouter> | undefined;

const getOpenRouter = (): ReturnType<typeof createOpenRouter> => {
	if (!client) {
		client = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
	}
	return client;
};

export const textModel = () => getOpenRouter().chat(TEXT_MODEL);
export const svgModel = () => getOpenRouter().chat(SVG_MODEL);
