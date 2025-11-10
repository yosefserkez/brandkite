import { readFile } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "../../convex/_generated/api";

const DEFAULT_INPUT_PATH = "scripts/logos/logos_with_text_and_embeddings.jsonl";

type LogoRecord = {
	image: {
		bytes: string;
		path: string;
	};
	text: string;
	textEmbedding: number[];
	imageEmbedding: number[];
	tags?: string[] | null;
};

type IngestPayload = {
	logoId: string;
	description: string;
	tags?: string[];
	textEmbedding: number[];
	imageEmbedding: number[];
	previewPng: string;
};

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

async function readRecords(filePath: string): Promise<LogoRecord[]> {
	const content = await readFile(filePath, "utf-8");
	return content
		.split("\n")
		.filter((line) => line.trim().length > 0)
		.map((line) => JSON.parse(line) as LogoRecord);
}

function buildPayload(record: LogoRecord): IngestPayload {
	const parsedPath = path.parse(record.image.path);
	const logoId =
		parsedPath.name.length > 0 ? parsedPath.name : record.image.path;

	return {
		logoId,
		description: record.text,
		tags: record.tags ?? undefined,
		textEmbedding: record.textEmbedding,
		imageEmbedding: record.imageEmbedding,
		previewPng: record.image.bytes,
	};
}

const MAX_BATCH_BYTES = 4_000_000;

function partitionRecords(records: IngestPayload[]): IngestPayload[][] {
	const batches: IngestPayload[][] = [];
	let current: IngestPayload[] = [];
	let currentSize = 0;
	const encoder = new TextEncoder();

	for (const record of records) {
		const recordJson = JSON.stringify(record);
		const recordSize = encoder.encode(recordJson).length;

		if (recordSize > MAX_BATCH_BYTES) {
			throw new Error(
				`Single record for logo "${record.logoId}" exceeds batch size limit of ${MAX_BATCH_BYTES} bytes.`
			);
		}

		if (current.length > 0 && currentSize + recordSize > MAX_BATCH_BYTES) {
			batches.push(current);
			current = [];
			currentSize = 0;
		}

		current.push(record);
		currentSize += recordSize;
	}

	if (current.length > 0) {
		batches.push(current);
	}

	return batches;
}

function createConvexClient(
	convexUrl: string,
	adminKey: string
): ConvexHttpClient {
	const client = new ConvexHttpClient(convexUrl);
	client.setAdminAuth(adminKey);
	return client;
}

async function ingestBatch(
	client: ConvexHttpClient,
	records: IngestPayload[]
): Promise<void> {
	await client.mutation(internal.logos.ingestBatch, {
		records,
	});
}

async function main(): Promise<void> {
	const inputPath = process.argv[2] ?? DEFAULT_INPUT_PATH;
	const absoluteInputPath = path.resolve(process.cwd(), inputPath);
	const convexUrl = requireEnv("VITE_CONVEX_URL");
	const convexAdminKey = requireEnv("CONVEX_ADMIN_KEY_DEV");
	const convexClient = createConvexClient(convexUrl, convexAdminKey);

	const records = await readRecords(absoluteInputPath);
	if (records.length === 0) {
		stdout.write(`No records found in ${absoluteInputPath}\n`);
		return;
	}

	const payload = records.map(buildPayload);
	const batches = partitionRecords(payload);

	let ingestedCount = 0;
	for (const [index, batch] of batches.entries()) {
		await ingestBatch(convexClient, batch);
		ingestedCount += batch.length;
		stdout.write(
			`Ingested batch ${index + 1}/${batches.length} (${batch.length} records)\n`
		);
	}

	stdout.write(
		`Ingested ${ingestedCount} logo records from ${absoluteInputPath}\n`
	);
}

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	stdout.write(`Ingestion failed: ${message}\n`);
	process.exitCode = 1;
});
