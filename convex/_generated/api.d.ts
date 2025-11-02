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
import type * as index from "../index.js";
import type * as internal_ from "../internal.js";
import type * as lib_firecrawl from "../lib/firecrawl.js";
import type * as lib_zodToConvex from "../lib/zodToConvex.js";
import type * as logger from "../logger.js";
import type * as modules_brandContext from "../modules/brandContext.js";
import type * as modules_name from "../modules/name.js";
import type * as presence from "../presence.js";
import type * as workflows_companyContext from "../workflows/companyContext.js";
import type * as workflows_modules_business from "../workflows/modules/business.js";
import type * as workflows_modules_colors from "../workflows/modules/colors.js";
import type * as workflows_modules_customer from "../workflows/modules/customer.js";
import type * as workflows_modules_differentiators from "../workflows/modules/differentiators.js";
import type * as workflows_modules_imagery from "../workflows/modules/imagery.js";
import type * as workflows_modules_index from "../workflows/index.js";
import type * as workflows_modules_logo from "../workflows/modules/logo.js";
import type * as workflows_modules_market from "../workflows/modules/market.js";
import type * as workflows_modules_mission from "../workflows/modules/mission.js";
import type * as workflows_modules_narratives from "../workflows/modules/narratives.js";
import type * as workflows_modules_personality from "../workflows/modules/personality.js";
import type * as workflows_modules_personas from "../workflows/modules/personas.js";
import type * as workflows_modules_positioning from "../workflows/modules/positioning.js";
import type * as workflows_modules_product from "../workflows/modules/product.js";
import type * as workflows_modules_promise from "../workflows/modules/promise.js";
import type * as workflows_modules_purpose from "../workflows/modules/purpose.js";
import type * as workflows_modules_story from "../workflows/modules/story.js";
import type * as workflows_modules_tagline from "../workflows/modules/tagline.js";
import type * as workflows_modules_team from "../workflows/modules/team.js";
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
	index: typeof index;
	internal: typeof internal_;
	"lib/firecrawl": typeof lib_firecrawl;
	"lib/zodToConvex": typeof lib_zodToConvex;
	logger: typeof logger;
	"modules/brandContext": typeof modules_brandContext;
	"modules/name": typeof modules_name;
	presence: typeof presence;
	"workflows/companyContext": typeof workflows_companyContext;
	"workflows/modules/business": typeof workflows_modules_business;
	"workflows/modules/colors": typeof workflows_modules_colors;
	"workflows/modules/customer": typeof workflows_modules_customer;
	"workflows/modules/differentiators": typeof workflows_modules_differentiators;
	"workflows/modules/imagery": typeof workflows_modules_imagery;
	"workflows/modules/index": typeof workflows_modules_index;
	"workflows/modules/logo": typeof workflows_modules_logo;
	"workflows/modules/market": typeof workflows_modules_market;
	"workflows/modules/mission": typeof workflows_modules_mission;
	"workflows/modules/narratives": typeof workflows_modules_narratives;
	"workflows/modules/personality": typeof workflows_modules_personality;
	"workflows/modules/personas": typeof workflows_modules_personas;
	"workflows/modules/positioning": typeof workflows_modules_positioning;
	"workflows/modules/product": typeof workflows_modules_product;
	"workflows/modules/promise": typeof workflows_modules_promise;
	"workflows/modules/purpose": typeof workflows_modules_purpose;
	"workflows/modules/story": typeof workflows_modules_story;
	"workflows/modules/tagline": typeof workflows_modules_tagline;
	"workflows/modules/team": typeof workflows_modules_team;
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

export declare const components: {
	workflow: {
		journal: {
			load: FunctionReference<
				"query",
				"internal",
				{ workflowId: string },
				{
					journalEntries: Array<{
						_creationTime: number;
						_id: string;
						step: {
							args: any;
							argsSize: number;
							completedAt?: number;
							functionType: "query" | "mutation" | "action";
							handle: string;
							inProgress: boolean;
							name: string;
							runResult?:
								| { kind: "success"; returnValue: any }
								| { error: string; kind: "failed" }
								| { kind: "canceled" };
							startedAt: number;
							workId?: string;
						};
						stepNumber: number;
						workflowId: string;
					}>;
					logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
					ok: boolean;
					workflow: {
						_creationTime: number;
						_id: string;
						args: any;
						generationNumber: number;
						logLevel?: any;
						name?: string;
						onComplete?: { context?: any; fnHandle: string };
						runResult?:
							| { kind: "success"; returnValue: any }
							| { error: string; kind: "failed" }
							| { kind: "canceled" };
						startedAt?: any;
						state?: any;
						workflowHandle: string;
					};
				}
			>;
			startSteps: FunctionReference<
				"mutation",
				"internal",
				{
					generationNumber: number;
					steps: Array<{
						retry?:
							| boolean
							| { base: number; initialBackoffMs: number; maxAttempts: number };
						schedulerOptions?: { runAt?: number } | { runAfter?: number };
						step: {
							args: any;
							argsSize: number;
							completedAt?: number;
							functionType: "query" | "mutation" | "action";
							handle: string;
							inProgress: boolean;
							name: string;
							runResult?:
								| { kind: "success"; returnValue: any }
								| { error: string; kind: "failed" }
								| { kind: "canceled" };
							startedAt: number;
							workId?: string;
						};
					}>;
					workflowId: string;
					workpoolOptions?: {
						defaultRetryBehavior?: {
							base: number;
							initialBackoffMs: number;
							maxAttempts: number;
						};
						logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
						maxParallelism?: number;
						retryActionsByDefault?: boolean;
					};
				},
				Array<{
					_creationTime: number;
					_id: string;
					step: {
						args: any;
						argsSize: number;
						completedAt?: number;
						functionType: "query" | "mutation" | "action";
						handle: string;
						inProgress: boolean;
						name: string;
						runResult?:
							| { kind: "success"; returnValue: any }
							| { error: string; kind: "failed" }
							| { kind: "canceled" };
						startedAt: number;
						workId?: string;
					};
					stepNumber: number;
					workflowId: string;
				}>
			>;
		};
		workflow: {
			cancel: FunctionReference<
				"mutation",
				"internal",
				{ workflowId: string },
				null
			>;
			cleanup: FunctionReference<
				"mutation",
				"internal",
				{ workflowId: string },
				boolean
			>;
			complete: FunctionReference<
				"mutation",
				"internal",
				{
					generationNumber: number;
					runResult:
						| { kind: "success"; returnValue: any }
						| { error: string; kind: "failed" }
						| { kind: "canceled" };
					workflowId: string;
				},
				null
			>;
			create: FunctionReference<
				"mutation",
				"internal",
				{
					maxParallelism?: number;
					onComplete?: { context?: any; fnHandle: string };
					startAsync?: boolean;
					workflowArgs: any;
					workflowHandle: string;
					workflowName: string;
				},
				string
			>;
			getStatus: FunctionReference<
				"query",
				"internal",
				{ workflowId: string },
				{
					inProgress: Array<{
						_creationTime: number;
						_id: string;
						step: {
							args: any;
							argsSize: number;
							completedAt?: number;
							functionType: "query" | "mutation" | "action";
							handle: string;
							inProgress: boolean;
							name: string;
							runResult?:
								| { kind: "success"; returnValue: any }
								| { error: string; kind: "failed" }
								| { kind: "canceled" };
							startedAt: number;
							workId?: string;
						};
						stepNumber: number;
						workflowId: string;
					}>;
					logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
					workflow: {
						_creationTime: number;
						_id: string;
						args: any;
						generationNumber: number;
						logLevel?: any;
						name?: string;
						onComplete?: { context?: any; fnHandle: string };
						runResult?:
							| { kind: "success"; returnValue: any }
							| { error: string; kind: "failed" }
							| { kind: "canceled" };
						startedAt?: any;
						state?: any;
						workflowHandle: string;
					};
				}
			>;
		};
	};
};
