import { z } from "zod";

export type FirecrawlResponse = {
	success: boolean;
	message?: string;
	data?: {
		metadata?: JSON;
		json?: JSON;
		markdown?: string;
		summary?: string;
	};
	error?: string;
};

type FirecrawlFormatsType =
	| {
			type: "json";
			schema: unknown;
	  }
	| "summary"
	| "markdown";

const firecrawl = async (
	url: string,
	options: {
		formats: FirecrawlFormatsType[];
		onlyMainContent?: boolean;
		maxAge?: number;
		parsers?: string[];
	}
) => {
	const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/scrape";

	const firecrawlOptions = {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ...options, url }),
	};

	try {
		const response = await fetch(FIRECRAWL_API_URL, firecrawlOptions);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		throw new Error(`Failed to scrape ${url}: ${error}`);
	}
};
export const companySummaryFormat: FirecrawlFormatsType = {
	type: "json",
	schema: z.object({
		company_name: z.string().optional().describe("The name of the company"),
		company_description: z
			.string()
			.optional()
			.describe("The description of the company"),
		logo_url: z.string().optional().describe("The URL of the company's logo"),
		company_summary: z
			.string()
			.optional()
			.describe("The summary of the company"),
		company_mission: z
			.string()
			.optional()
			.describe("The mission of the company"),
		team: z
			.array(
				z.object({
					name: z.string().optional().describe("The name of the team member"),
					role: z.string().optional().describe("The role of the team member"),
					image_url: z
						.string()
						.optional()
						.describe("The URL of the team member's image"),
					summary: z
						.string()
						.optional()
						.describe("The summary of the team member"),
				})
			)
			.optional(),
		product_summary: z
			.string()
			.optional()
			.describe("The summary of the product"),
		market_summary: z.string().optional().describe("The summary of the market"),
		customer_summary: z
			.string()
			.optional()
			.describe("The summary of the customer"),
		brand_summary: z.string().optional().describe("The summary of the brand"),
		business_summary: z
			.string()
			.optional()
			.describe("The summary of the business"),
	}),
};

export const scrape = async (
	url: string,
	formats: FirecrawlFormatsType[]
): Promise<FirecrawlResponse> => {
	const scrapeResult = await firecrawl(url, {
		formats,
	});
	return scrapeResult;
};
