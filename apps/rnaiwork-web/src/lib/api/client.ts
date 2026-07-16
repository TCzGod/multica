/**
 * Base API client for the RNAIWork web frontend.
 *
 * Design notes:
 * - Cookie-based auth: the browser sends the `multica_logged_in` cookie
 *   automatically via `credentials: "include"`. We never read the cookie
 *   value in JS — the HttpOnly flag prevents that anyway.
 * - Workspace scoping: workspace-scoped endpoints (issues, agents, etc.)
 *   require X-Workspace-Slug (preferred) or X-Workspace-ID so the backend
 *   middleware (server/internal/middleware/workspace.go) can resolve the
 *   workspace UUID and validate membership. The active workspace is
 *   registered here via setWorkspaceContext() so fetchAPI can inject the
 *   header synchronously without touching React on every request.
 * - Base URL: VITE_API_URL resolves to the backend host in production
 *   (e.g. http://backend:8080). Empty in dev — the Vite proxy forwards
 *   /api, /auth, and /uploads to the backend (see vite.config.ts).
 */

import type { Workspace } from "./types";

/** Auth cookie name. Sent automatically by the browser; documented for
 *  discoverability — we don't interact with it directly. */
export const AUTH_COOKIE_NAME = "multica_logged_in";

/**
 * Error thrown by fetchAPI when the server returns a non-2xx response.
 * `status` carries the HTTP status code (0 for network failures); `body`
 * holds the parsed JSON error payload when the server sent one.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Base URL for API requests. Resolved from VITE_API_URL with any trailing
 * slash stripped. Empty string means same-origin (dev proxy handles routing).
 */
const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

// ---------------------------------------------------------------------------
// Workspace context
//
// The app shell / router owns the active workspace. It registers itself
// via setWorkspaceContext() so fetchAPI can read the slug synchronously
// and inject the X-Workspace-Slug header on every workspace-scoped request.
// Pass null to clear (e.g. on logout). This mirrors the mobile pattern in
// apps/mobile/data/workspace-store.ts (getCurrentSlug).
// ---------------------------------------------------------------------------

interface WorkspaceContext {
  slug: string | null;
  id: string | null;
}

let workspaceContext: WorkspaceContext = { slug: null, id: null };

/** Set the active workspace for subsequent API requests. Call this from
 *  the router whenever the user switches workspaces, and pass null on
 *  logout. Either slug (preferred) or id (fallback) may be provided. */
export function setWorkspaceContext(ctx: {
  slug?: string | null;
  id?: string | null;
} | null): void {
  workspaceContext = {
    slug: ctx?.slug ?? null,
    id: ctx?.id ?? null,
  };
}

/** Read the current workspace context (mainly for testing / inspection). */
export function getWorkspaceContext(): WorkspaceContext {
  return workspaceContext;
}

// ---------------------------------------------------------------------------
// fetchAPI
// ---------------------------------------------------------------------------

export interface FetchAPIOptions {
  method?: string;
  /** Request body — will be JSON.stringify'd. Omit for GET / DELETE. */
  body?: unknown;
  /** Additional headers. Content-Type and workspace headers are set
   *  automatically; callers can override Content-Type for multipart. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Core fetch wrapper shared by every API module.
 *
 * - Sends credentials (cookies) on every request.
 * - Injects JSON Content-Type + Accept headers.
 * - Injects X-Workspace-Slug (or X-Workspace-ID) when a workspace is active.
 * - Throws ApiError on non-2xx responses (parsed body included).
 * - Returns parsed JSON, or undefined for 204 No Content / empty bodies.
 */
export async function fetchAPI<T = unknown>(
  path: string,
  options: FetchAPIOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  // Workspace header injection. Slug is preferred — the backend resolves
  // slug → UUID via GetWorkspaceBySlug and validates membership. Fall
  // back to X-Workspace-ID for CLI/daemon parity.
  const ws = workspaceContext;
  if (ws.slug) {
    finalHeaders["X-Workspace-Slug"] = ws.slug;
  } else if (ws.id) {
    finalHeaders["X-Workspace-ID"] = ws.id;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      signal,
    });
  } catch (err) {
    // Re-throw AbortError unchanged so callers (React Query) can detect
    // cancellation. Wrap everything else in ApiError with status 0.
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Network request failed",
      0,
    );
  }

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = undefined;
    }
    const message = extractErrorMessage(errorBody) ?? `${res.status} ${res.statusText}`;
    throw new ApiError(message, res.status, errorBody);
  }

  // 204 No Content — nothing to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  // Guard against empty bodies (e.g. 200 with no content) to avoid
  // JSON.parse throwing on an empty string.
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

/** Pull a human-readable message out of a parsed error body. The backend
 *  uses both `{"message": "..."}` and `{"error": "..."}` shapes depending
 *  on the handler. */
function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  return null;
}

/** Re-export Workspace type so consumers can import everything from
 *  client.ts if they prefer. Avoids a circular dependency since this
 *  module only needs the type (erased at compile time). */
export type { Workspace };
