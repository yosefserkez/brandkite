import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

export const r2 = new R2(components.r2);

export const getSignedUrl = query({
	args: { key: v.string() },
	// In the future we might check if the key belongs to the company or other permissions, but for now we just return the URL
	handler: async (_ctx, args) => await r2.getUrl(args.key),
});
