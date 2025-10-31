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
import type * as brandModules from "../brandModules.js";
import type * as companies from "../companies.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as presence from "../presence.js";
import type * as workflows_modules_colors from "../workflows/modules/colors.js";
import type * as workflows_modules_differentiators from "../workflows/modules/differentiators.js";
import type * as workflows_modules_imagery from "../workflows/modules/imagery.js";
import type * as workflows_modules_index from "../workflows/modules/index.js";
import type * as workflows_modules_logo from "../workflows/modules/logo.js";
import type * as workflows_modules_mission from "../workflows/modules/mission.js";
import type * as workflows_modules_name from "../workflows/modules/name.js";
import type * as workflows_modules_narratives from "../workflows/modules/narratives.js";
import type * as workflows_modules_personality from "../workflows/modules/personality.js";
import type * as workflows_modules_personas from "../workflows/modules/personas.js";
import type * as workflows_modules_positioning from "../workflows/modules/positioning.js";
import type * as workflows_modules_promise from "../workflows/modules/promise.js";
import type * as workflows_modules_purpose from "../workflows/modules/purpose.js";
import type * as workflows_modules_story from "../workflows/modules/story.js";
import type * as workflows_modules_tagline from "../workflows/modules/tagline.js";
import type * as workflows_modules_tone from "../workflows/modules/tone.js";
import type * as workflows_modules_typography from "../workflows/modules/typography.js";
import type * as workflows_modules_values from "../workflows/modules/values.js";
import type * as workflows_modules_vision from "../workflows/modules/vision.js";
import type * as workflows_modules_voice from "../workflows/modules/voice.js";
import type * as workflows_orchestrator from "../workflows/orchestrator.js";
import type * as workflows_registry from "../workflows/registry.js";
import type * as workflows_types from "../workflows/types.js";

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
  brandModules: typeof brandModules;
  companies: typeof companies;
  http: typeof http;
  internal: typeof internal_;
  presence: typeof presence;
  "workflows/modules/colors": typeof workflows_modules_colors;
  "workflows/modules/differentiators": typeof workflows_modules_differentiators;
  "workflows/modules/imagery": typeof workflows_modules_imagery;
  "workflows/modules/index": typeof workflows_modules_index;
  "workflows/modules/logo": typeof workflows_modules_logo;
  "workflows/modules/mission": typeof workflows_modules_mission;
  "workflows/modules/name": typeof workflows_modules_name;
  "workflows/modules/narratives": typeof workflows_modules_narratives;
  "workflows/modules/personality": typeof workflows_modules_personality;
  "workflows/modules/personas": typeof workflows_modules_personas;
  "workflows/modules/positioning": typeof workflows_modules_positioning;
  "workflows/modules/promise": typeof workflows_modules_promise;
  "workflows/modules/purpose": typeof workflows_modules_purpose;
  "workflows/modules/story": typeof workflows_modules_story;
  "workflows/modules/tagline": typeof workflows_modules_tagline;
  "workflows/modules/tone": typeof workflows_modules_tone;
  "workflows/modules/typography": typeof workflows_modules_typography;
  "workflows/modules/values": typeof workflows_modules_values;
  "workflows/modules/vision": typeof workflows_modules_vision;
  "workflows/modules/voice": typeof workflows_modules_voice;
  "workflows/orchestrator": typeof workflows_orchestrator;
  "workflows/registry": typeof workflows_registry;
  "workflows/types": typeof workflows_types;
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
