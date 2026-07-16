/**
 * Auth API functions. All routes here are user-scoped (no workspace
 * header required) unless noted.
 *
 * send-code / verify-code set the auth cookie via Set-Cookie headers;
 * the browser stores it and fetchAPI sends it automatically via
 * credentials: "include".
 */
import { fetchAPI } from "./client";
import type { AppConfig, User } from "./types";

/** POST /auth/send-code — email a one-time login code. */
export async function sendCode(email: string): Promise<void> {
  await fetchAPI<void>("/auth/send-code", {
    method: "POST",
    body: { email },
  });
}

/** POST /auth/verify-code — exchange email + code for an authenticated
 *  session. The server sets the auth cookie in the response. */
export async function verifyCode(email: string, code: string): Promise<void> {
  await fetchAPI<void>("/auth/verify-code", {
    method: "POST",
    body: { email, code },
  });
}

/** POST /auth/logout — invalidate the session and clear the auth cookie. */
export async function logout(): Promise<void> {
  await fetchAPI<void>("/auth/logout", { method: "POST" });
}

/** GET /api/me — the currently authenticated user. */
export async function getMe(): Promise<User> {
  return fetchAPI<User>("/api/me");
}

/** PATCH /api/me — update the current user's profile (name, avatar_url,
 *  onboarding fields). Returns the updated user. */
export async function updateMe(data: Partial<User>): Promise<User> {
  return fetchAPI<User>("/api/me", { method: "PATCH", body: data });
}

/** GET /api/config — public app configuration (CDN domain, signup flag,
 *  daemon URLs). No auth required. */
export async function getConfig(): Promise<AppConfig> {
  return fetchAPI<AppConfig>("/api/config");
}
