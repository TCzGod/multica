import { fetchAPI, apiPost } from "./client";
import type { User } from "./types";

export function sendCode(email: string) {
  return apiPost<{ ok?: boolean }>("/auth/send-code", { email });
}

export function verifyCode(email: string, code: string) {
  return apiPost<{ ok?: boolean } & Partial<User>>("/auth/verify-code", {
    email,
    code,
  });
}

export function logout() {
  return apiPost<{ ok?: boolean }>("/auth/logout");
}

export function getMe() {
  return fetchAPI<User>("/api/me");
}
