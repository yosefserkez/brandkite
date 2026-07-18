import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import { logger } from "../../logger";
import type { CheckViolation } from "./checks";

// Generate → deterministic checks → one corrective retry. The cheap half of
// the design-engine quality loop (.ai-business/DESIGN-ENGINE.md); the
// rendered-critique jury arrives in Phase B.
export const generateChecked = async <T>(params: {
	model: LanguageModel;
	system: string;
	prompt: string;
	temperature: number;
	schema: z.ZodType<T>;
	check?: (value: T) => CheckViolation[];
	label: string;
}): Promise<T> => {
	const { model, system, prompt, temperature, schema, check, label } = params;

	const run = async (fullPrompt: string): Promise<T> => {
		const { object } = await generateObject({
			model,
			system,
			schema: z.object({ value: schema }),
			prompt: fullPrompt,
			temperature,
		});
		return (object as { value: T }).value;
	};

	const first = await run(prompt);
	const violations = check?.(first) ?? [];
	if (violations.length === 0) {
		return first;
	}

	logger.info("Design checks failed; retrying with corrections", {
		label,
		violations,
	});
	const retryPrompt = [
		prompt,
		"",
		"Your previous draft failed these quality checks — fix every one without losing specificity:",
		...violations.map((violation) => `- ${violation}`),
	].join("\n");
	const second = await run(retryPrompt);
	const remaining = check?.(second) ?? [];
	if (remaining.length > 0) {
		logger.warn("Design checks still failing after retry; keeping best draft", {
			label,
			violations: remaining,
		});
	}
	return remaining.length <= violations.length ? second : first;
};
