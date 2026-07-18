import posthog from "posthog-js";

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host =
	(import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
	"https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
	if (!key || initialized || typeof window === "undefined") {
		return;
	}
	posthog.init(key, {
		api_host: host,
		capture_pageview: "history_change",
		capture_pageleave: true,
		autocapture: true,
	});
	initialized = true;
}

export function identifyUser(userId: string, email?: string) {
	if (!initialized) {
		return;
	}
	posthog.identify(userId, email ? { email } : undefined);
}

export function resetAnalytics() {
	if (!initialized) {
		return;
	}
	posthog.reset();
}

type AnalyticsEvent =
	| "company_created"
	| "module_generation_started"
	| "kit_published"
	| "public_kit_viewed"
	| "checkout_started"
	| "plan_purchased"
	| "credits_exhausted"
	| "share_clicked";

export function track(
	event: AnalyticsEvent,
	properties?: Record<string, unknown>
) {
	if (!initialized) {
		return;
	}
	posthog.capture(event, properties);
}
