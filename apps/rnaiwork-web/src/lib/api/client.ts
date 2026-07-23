import type { WorkspaceContext } from "./types";

/* ------------------------------------------------------------------
   Module-level workspace context. Set synchronously before any
   workspace-scoped query runs so the X-Workspace-Slug header is present.
------------------------------------------------------------------- */
let workspaceContext: WorkspaceContext = { slug: null, id: null };

export function setWorkspaceContext(ctx: WorkspaceContext) {
  workspaceContext = ctx;
}

export function getWorkspaceContext(): WorkspaceContext {
  return workspaceContext;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return res.statusText || `Request failed (${res.status})`;
  try {
    const json = JSON.parse(text);
    if (typeof json === "string") return json;
    if (json?.error) return String(json.error);
    if (json?.message) return String(json.message);
    if (json?.detail) return String(json.detail);
    return text;
  } catch {
    return text;
  }
}

/**
 * Reads the `multica_csrf` cookie set by the backend at login. The cookie
 * is non-HttpOnly so JS can read it; the backend's CSRF middleware validates
 * this value against an HMAC of the auth token stored in the HttpOnly
 * `multica_auth` cookie. We must send this header on every state-changing
 * request (POST/PUT/PATCH/DELETE) when authenticating via cookies.
 */
function readCSRFToken(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = "multica_csrf=";
  for (const raw of document.cookie.split(";")) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Thin fetch wrapper. Injects credentials + workspace slug header, parses
 * JSON, and throws a typed ApiError on non-2xx responses.
 */
export async function fetchAPI<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (workspaceContext.slug) {
    headers["X-Workspace-Slug"] = workspaceContext.slug;
  }

  // Inject CSRF header on state-changing methods. The backend validates it
  // against the auth cookie to defend against CSRF (double-submit pattern).
  // GET/HEAD/OPTIONS are exempt (handled server-side).
  const method = (options.method ?? "GET").toUpperCase();
  if (
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    headers["X-CSRF-Token"] === undefined
  ) {
    const csrf = readCSRFToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
    );
  }

  if (res.status === 401) {
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const message = await parseError(res);
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestInit) {
  return fetchAPI<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...options,
  });
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestInit) {
  return fetchAPI<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...options,
  });
}

export function apiDelete<T>(path: string, options?: RequestInit) {
  return fetchAPI<T>(path, { method: "DELETE", ...options });
}
