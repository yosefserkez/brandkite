import { wrapVinxiConfigWithSentry } from "@sentry/tanstackstart-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const INGEST_REWRITE = /^\/ingest/;

const config = defineConfig({
	plugins: [
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		nitro(),
		viteReact(),
	],
	server: {
		proxy: {
			"/ingest/static": {
				target: "https://us-assets.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(INGEST_REWRITE, ""),
				secure: false,
			},
			"/ingest/array": {
				target: "https://us-assets.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(INGEST_REWRITE, ""),
				secure: false,
			},
			"/ingest": {
				target: "https://us.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(INGEST_REWRITE, ""),
				secure: false,
			},
		},
	},
});

export default wrapVinxiConfigWithSentry(config, {
	org: process.env.VITE_SENTRY_ORG,
	project: process.env.VITE_SENTRY_PROJECT,
	authToken: process.env.SENTRY_AUTH_TOKEN,
	// Only print logs for uploading source maps in CI
	// Set to `true` to suppress logs
	silent: !process.env.CI,
});
