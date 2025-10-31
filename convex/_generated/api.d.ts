/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as brandModuleSchemas from "../brandModuleSchemas.js";
import type * as brandModules from "../brandModules.js";
import type * as companies from "../companies.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as presence from "../presence.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  brandModuleSchemas: typeof brandModuleSchemas;
  brandModules: typeof brandModules;
  companies: typeof companies;
  http: typeof http;
  internal: typeof internal_;
  presence: typeof presence;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
