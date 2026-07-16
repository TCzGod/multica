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

export type * from "./types";
