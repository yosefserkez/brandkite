import { createReadStream, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { ZipFile } from "yazl";

type ImageRecord =
	| string
	| {
			bytes?: string;
			data?: string;
			base64?: string;
			path?: string;
	  };

type LogoRecord = {
	image?: ImageRecord;
	path?: string;
	text?: string;
	description?: string;
	caption?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROGRESS_INTERVAL = 100;
const SERIAL_WIDTH = 4;

await main().catch((error) => {
	process.stderr.write(`Error: ${(error as Error).message}\n`);
	process.exitCode = 1;
});

async function main() {
	const [inputArg, outputArg] = process.argv.slice(2);
	const inputPath = resolve(
		__dirname,
		inputArg ?? "logos_with_text_and_embeddings.jsonl"
	);
	const outputPath = resolve(__dirname, outputArg ?? "logos.zip");

	await mkdir(dirname(outputPath), { recursive: true });

	const inputStream = createReadStream(inputPath, { encoding: "utf8" });
	const zip = new ZipFile();
	const outputStream = createWriteStream(outputPath);

	const zipClosed = new Promise<void>((resolveZip, rejectZip) => {
		zip.outputStream
			.pipe(outputStream)
			.on("close", resolveZip)
			.on("error", rejectZip);
		outputStream.on("error", rejectZip);
	});

	const reader = createInterface({
		input: inputStream,
		crlfDelay: Number.POSITIVE_INFINITY,
	});

	let count = 0;

	for await (const rawLine of reader) {
		const line = rawLine.trim();
		if (line.length === 0) {
			continue;
		}

		let record: LogoRecord;
		try {
			record = JSON.parse(line) as LogoRecord;
		} catch (parseError) {
			process.stderr.write(
				`Skipped invalid JSON line ${count + 1}: ${(parseError as Error).message}\n`
			);
			continue;
		}

		const { payload, suggestedName } = extractImage(record.image);
		if (!isNonEmptyString(payload)) {
			process.stderr.write(
				`Skipped entry ${count + 1}: missing image payload\n`
			);
			continue;
		}

		const imageBuffer = toBuffer(payload);
		const imageFileName = getImageFileName(record, suggestedName, count);
		zip.addBuffer(imageBuffer, imageFileName, { compress: false });

		const textContent = pickDescription(record);
		const textFileName = `${stripExtension(imageFileName)}.txt`;
		zip.addBuffer(Buffer.from(textContent, "utf8"), textFileName, {
			compress: true,
		});

		count += 1;
		if (count % PROGRESS_INTERVAL === 0) {
			process.stdout.write(`Added ${count} logos...\n`);
		}
	}

	reader.close();
	zip.end();
	await zipClosed;

	process.stdout.write(`Wrote ${count} logos to ${outputPath}\n`);
}

function toBuffer(base64: string): Buffer {
	const payload = base64.startsWith("data:") ? base64.split(",").at(1) : base64;
	if (!isNonEmptyString(payload)) {
		throw new Error("Unable to decode image payload");
	}
	return Buffer.from(payload, "base64");
}

function getImageFileName(
	record: LogoRecord,
	suggestedName: string | undefined,
	index: number
): string {
	const candidates = [
		suggestedName,
		record.path,
		getImageObjectPath(record.image),
	];
	for (const candidate of candidates) {
		if (isNonEmptyString(candidate)) {
			return basename(candidate);
		}
	}

	const serial = (index + 1).toString().padStart(SERIAL_WIDTH, "0");
	return `logo-${serial}.jpg`;
}

function stripExtension(fileName: string): string {
	const extension = extname(fileName);
	if (extension.length === 0) {
		return fileName;
	}
	return fileName.slice(0, fileName.length - extension.length);
}

function pickDescription(record: LogoRecord): string {
	if (isNonEmptyString(record.text)) {
		return record.text;
	}
	if (isNonEmptyString(record.description)) {
		return record.description;
	}
	if (isNonEmptyString(record.caption)) {
		return record.caption;
	}
	return "";
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function extractImage(image: ImageRecord | undefined): {
	payload?: string;
	suggestedName?: string;
} {
	if (typeof image === "string") {
		return { payload: image };
	}
	if (image && typeof image === "object") {
		const payload = firstNonEmpty([image.bytes, image.data, image.base64]);
		return {
			payload,
			suggestedName: image.path,
		};
	}
	return {};
}

function getImageObjectPath(
	image: ImageRecord | undefined
): string | undefined {
	if (image && typeof image === "object") {
		return image.path;
	}
	return;
}

function firstNonEmpty(values: Array<string | undefined>): string | undefined {
	for (const value of values) {
		if (isNonEmptyString(value)) {
			return value;
		}
	}
	return;
}
