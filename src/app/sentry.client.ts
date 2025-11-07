import { init } from "@sentry/tanstackstart-react";

let initialized = false;

export const initSentryClient = () => {
	if (initialized || import.meta.env.SSR) {
		return;
	}

	const dsn = import.meta.env.VITE_SENTRY_DSN;
	if (!dsn) {
		return;
	}

	init({
		dsn,
		environment:
			import.meta.env.VITE_SENTRY_ENV ??
			import.meta.env.MODE ??
			(import.meta.env.DEV ? "development" : "production"),
		integrations: [],
		tracesSampleRate: 1,
		enableLogs: true,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1,
	});

	initialized = true;
};
