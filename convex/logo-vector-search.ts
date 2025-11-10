import { createOpenAI } from "@ai-sdk/openai";
import { startSpan as sentryStartSpan } from "@sentry/tanstackstart-react";
import { embed, generateText } from "ai";
import { v } from "convex/values";
import Replicate from "replicate";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
	type ActionCtx,
	action,
	internalMutation,
	internalQuery,
} from "./_generated/server";

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const CLIP_MODEL_IDENTIFIER = "openai/clip";
const CLIP_MODEL_VERSION = "clip-vit-large-patch14";
const TEXT_EMBEDDING_DIMENSIONS = 3072;
const IMAGE_EMBEDDING_DIMENSIONS = 768;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 50;
const RERANK_CANDIDATE_LIMIT = 10;
const HYBRID_TEXT_WEIGHT = 0.6;
const HYBRID_IMAGE_WEIGHT = 0.4;
const SCORE_DECIMAL_PLACES = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isIterable(value: unknown): value is Iterable<unknown> {
	return (
		isRecord(value) &&
		Symbol.iterator in value &&
		typeof (value as Record<PropertyKey, unknown>)[Symbol.iterator] ===
			"function"
	);
}

function ensureNumericIterable(iterable: Iterable<unknown>): number[] {
	const result: number[] = [];
	for (const element of iterable) {
		if (typeof element !== "number") {
			throw new Error("Embedding contains non-numeric value.");
		}
		if (!Number.isFinite(element)) {
			throw new Error("Embedding contains non-finite value.");
		}
		result.push(element);
	}
	return result;
}

function extractNestedEmbedding(
	record: Record<string, unknown>
): number[] | null {
	const candidateKeys = [
		"embedding",
		"embeddings",
		"image_embedding",
		"image_embeddings",
		"data",
		"output",
	];
	for (const key of candidateKeys) {
		if (key in record) {
			return toNumberArray(record[key]);
		}
	}
	return null;
}

function toNumberArray(raw: unknown): number[] {
	if (Array.isArray(raw) || isIterable(raw)) {
		return ensureNumericIterable(raw as Iterable<unknown>);
	}
	if (isRecord(raw)) {
		const nested = extractNestedEmbedding(raw);
		if (nested !== null) {
			return nested;
		}
	}
	throw new Error("Unexpected embedding response shape.");
}

let replicateClient: Replicate | undefined;

function getReplicateClient(): Replicate {
	if (!replicateClient) {
		const token = process.env.REPLICATE_API_TOKEN;
		if (!token) {
			throw new Error("REPLICATE_API_TOKEN environment variable is not set");
		}
		replicateClient = new Replicate({
			auth: token,
		});
	}
	return replicateClient;
}

async function getClipTextEmbedding(text: string): Promise<number[]> {
	const client = getReplicateClient();
	const output = await client.run(CLIP_MODEL_IDENTIFIER, {
		input: {
			task: "text_embedding",
			text,
			model: CLIP_MODEL_VERSION,
		},
	});
	return toNumberArray(output);
}

function normalizeScores(
	scores: Map<Id<"logoEmbeddings">, number>
): Map<Id<"logoEmbeddings">, number> {
	const values = Array.from(scores.values());
	if (values.length === 0) {
		return new Map();
	}
	const maxScore = Math.max(...values);
	const minScore = Math.min(...values);
	if (maxScore === minScore) {
		const normalized = new Map<Id<"logoEmbeddings">, number>();
		for (const [id] of scores) {
			normalized.set(id, 1);
		}
		return normalized;
	}
	const normalized = new Map<Id<"logoEmbeddings">, number>();
	for (const [id, score] of scores) {
		const value = (score - minScore) / (maxScore - minScore);
		normalized.set(id, value);
	}
	return normalized;
}

export const ingestBatch = internalMutation({
	args: {
		records: v.array(
			v.object({
				logoId: v.string(),
				description: v.string(),
				tags: v.optional(v.array(v.string())),
				textEmbedding: v.array(v.float64()),
				imageEmbedding: v.array(v.float64()),
				previewPng: v.string(),
			})
		),
	},
	handler: async (ctx, args) =>
		sentryStartSpan({ name: "logos.ingestBatch" }, async () => {
			const now = Date.now();

			for (const record of args.records) {
				if (record.textEmbedding.length !== TEXT_EMBEDDING_DIMENSIONS) {
					throw new Error(
						`textEmbedding must have ${TEXT_EMBEDDING_DIMENSIONS} dimensions`
					);
				}
				if (record.imageEmbedding.length !== IMAGE_EMBEDDING_DIMENSIONS) {
					throw new Error(
						`imageEmbedding must have ${IMAGE_EMBEDDING_DIMENSIONS} dimensions`
					);
				}

				const existing = await ctx.db
					.query("logoEmbeddings")
					.withIndex("by_logo_id", (q) => q.eq("logoId", record.logoId))
					.unique();

				if (existing) {
					await ctx.db.patch(existing._id, {
						description: record.description,
						tags: record.tags,
						textEmbedding: record.textEmbedding,
						imageEmbedding: record.imageEmbedding,
						previewPng: record.previewPng,
						updatedAt: now,
					});
					continue;
				}

				await ctx.db.insert("logoEmbeddings", {
					logoId: record.logoId,
					description: record.description,
					tags: record.tags,
					textEmbedding: record.textEmbedding,
					imageEmbedding: record.imageEmbedding,
					previewPng: record.previewPng,
					createdAt: now,
					updatedAt: now,
				});
			}
		}),
});

export const getLogosByIds = internalQuery({
	args: {
		ids: v.array(v.id("logoEmbeddings")),
	},
	handler: async (ctx, args) =>
		sentryStartSpan({ name: "logos.getLogosByIds" }, async () => {
			const results: Doc<"logoEmbeddings">[] = [];
			for (const id of args.ids) {
				const doc = await ctx.db.get(id);
				if (!doc) {
					continue;
				}
				results.push(doc);
			}
			return results;
		}),
});

type HybridScore = {
	text: number;
	image: number;
	combined: number;
};

type CombinedMatch = {
	id: string;
	description: string;
	tags: string[];
	scores: HybridScore;
	preview: string;
	_internalId: Id<"logoEmbeddings">;
};

async function computeCombinedScores({
	ctx,
	queryText,
	limit,
}: {
	ctx: ActionCtx;
	queryText: string;
	limit: number;
}): Promise<
	Array<{
		id: Id<"logoEmbeddings">;
		scores: HybridScore;
	}>
> {
	const [textEmbeddingResult, clipEmbedding] = await Promise.all([
		embed({
			model: openai.embedding("text-embedding-3-large"),
			value: queryText,
		}),
		getClipTextEmbedding(queryText),
	]);

	const textEmbedding = Array.from(textEmbeddingResult.embedding);
	if (textEmbedding.length !== TEXT_EMBEDDING_DIMENSIONS) {
		throw new Error(
			`query text embedding must have ${TEXT_EMBEDDING_DIMENSIONS} dimensions`
		);
	}
	if (clipEmbedding.length !== IMAGE_EMBEDDING_DIMENSIONS) {
		throw new Error(
			`query image embedding must have ${IMAGE_EMBEDDING_DIMENSIONS} dimensions`
		);
	}

	const [textResults, imageResults] = await Promise.all([
		ctx.vectorSearch("logoEmbeddings", "by_text_embedding", {
			vector: textEmbedding,
			limit,
		}),
		ctx.vectorSearch("logoEmbeddings", "by_image_embedding", {
			vector: clipEmbedding,
			limit,
		}),
	]);

	const textScores = new Map<Id<"logoEmbeddings">, number>();
	const imageScores = new Map<Id<"logoEmbeddings">, number>();

	for (const result of textResults) {
		textScores.set(result._id, result._score);
	}

	for (const result of imageResults) {
		imageScores.set(result._id, result._score);
	}

	const normalizedText = normalizeScores(textScores);
	const normalizedImage = normalizeScores(imageScores);

	const allIds = new Set<Id<"logoEmbeddings">>([
		...normalizedText.keys(),
		...normalizedImage.keys(),
	]);

	const scored: Array<{ id: Id<"logoEmbeddings">; scores: HybridScore }> = [];
	for (const id of allIds) {
		const textScore = normalizedText.get(id) ?? 0;
		const imageScore = normalizedImage.get(id) ?? 0;
		const combined =
			HYBRID_TEXT_WEIGHT * textScore + HYBRID_IMAGE_WEIGHT * imageScore;
		scored.push({
			id,
			scores: {
				text: textScore,
				image: imageScore,
				combined,
			},
		});
	}

	scored.sort((a, b) => b.scores.combined - a.scores.combined);
	return scored;
}

async function rerankWithLlm({
	topMatches,
	queryText,
}: {
	topMatches: CombinedMatch[];
	queryText: string;
}): Promise<string[]> {
	if (topMatches.length === 0) {
		return [];
	}

	const instructions = [
		`You are ranking brand logos for the request: "${queryText}".`,
		"Rank the following logo descriptions (with their ID) from best to worst aesthetic fit.",
		"Return a JSON array of IDs in ranked order. No commentary.",
	];
	const choices = topMatches
		.map(
			(match, index) =>
				`${index + 1}. ID: ${match.id}, Description: ${match.description}, Tags: ${match.tags.join(", ") || "none"}, Hybrid Score: ${match.scores.combined.toFixed(SCORE_DECIMAL_PLACES)}`
		)
		.join("\n");

	const rerankPrompt = `${instructions.join("\n")}\n\nCandidates:\n${choices}`;

	const response = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: rerankPrompt,
	});

	try {
		const parsed = JSON.parse(response.text) as string[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function applyRerankOrder(
	results: CombinedMatch[],
	rerankOrder: string[]
): void {
	const orderMap = new Map<string, number>();
	for (let index = 0; index < rerankOrder.length; index += 1) {
		orderMap.set(rerankOrder[index], index);
	}

	results.sort((a, b) => {
		const aIndex = orderMap.get(a.id);
		const bIndex = orderMap.get(b.id);
		if (aIndex === undefined && bIndex === undefined) {
			return b.scores.combined - a.scores.combined;
		}
		if (aIndex === undefined) {
			return 1;
		}
		if (bIndex === undefined) {
			return -1;
		}
		return aIndex - bIndex;
	});
}

export const hybridSearch = action({
	args: {
		name: v.string(),
		industry: v.string(),
		summary: v.string(),
		limit: v.optional(v.number()),
		rerank: v.optional(v.boolean()),
	},
	handler: async (ctx, args) =>
		sentryStartSpan({ name: "logos.hybridSearch" }, async () => {
			if (!process.env.OPENAI_API_KEY) {
				throw new Error("OPENAI_API_KEY environment variable is not set");
			}

			const limit = Math.min(
				args.limit ?? DEFAULT_SEARCH_LIMIT,
				MAX_SEARCH_LIMIT
			);

			const queryText =
				`${args.industry} logo for a brand named ${args.name}. ${args.summary}`.trim();

			const scored = await computeCombinedScores({
				ctx,
				queryText,
				limit,
			});

			const ids = scored.map((item) => item.id);
			const documents = await ctx.runQuery(internal.logos.getLogosByIds, {
				ids,
			});

			const docsById = new Map(documents.map((doc) => [doc._id, doc]));

			const combined: CombinedMatch[] = [];
			for (const item of scored) {
				const doc = docsById.get(item.id);
				if (!doc) {
					continue;
				}
				combined.push({
					id: doc.logoId,
					description: doc.description,
					tags: doc.tags ?? [],
					scores: item.scores,
					preview: `data:image/png;base64,${doc.previewPng}`,
					_internalId: doc._id,
				});
			}

			if (args.rerank) {
				const rerankOrder = await rerankWithLlm({
					topMatches: combined.slice(0, RERANK_CANDIDATE_LIMIT),
					queryText,
				});

				if (rerankOrder.length > 0) {
					applyRerankOrder(combined, rerankOrder);
				}
			}

			return combined.map((item) => ({
				id: item.id,
				description: item.description,
				tags: item.tags,
				scores: item.scores,
				preview: item.preview,
			}));
		}),
});
