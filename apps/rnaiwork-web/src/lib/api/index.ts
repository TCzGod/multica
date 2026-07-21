/**
 * Barrel export for the RNAIWork API client layer.
 *
 * Import API functions and types from this single entry point:
 *   import { listIssues, getMe, ApiError, type Issue } from "@/lib/api";
 */
export { ApiError, fetchAPI, setWorkspaceContext, getWorkspaceContext, AUTH_COOKIE_NAME } from "./client";
export type { FetchAPIOptions } from "./client";

export * as auth from "./auth";
export * as workspaces from "./workspaces";
export * as issues from "./issues";
export * as agents from "./agents";
export * as runtimes from "./runtimes";
export * as skills from "./skills";
export * as labels from "./labels";
export * as autopilots from "./autopilots";
export * as squads from "./squads";
export * as chat from "./chat";
export * as inbox from "./inbox";
export * as attachments from "./attachments";
export * as dashboard from "./dashboard";

export type * from "./types";
