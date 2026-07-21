import { fetchAPI, apiPost } from "./client";
import type { ChatMessage, ChatSession, CreateChatSessionInput } from "./types";

export function listChatSessions() {
  return fetchAPI<ChatSession[]>("/api/chat/sessions");
}

export function createChatSession(data: CreateChatSessionInput) {
  return apiPost<ChatSession>("/api/chat/sessions", data);
}

export function listChatMessages(sessionId: string) {
  return fetchAPI<ChatMessage[]>(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
  );
}

export function sendChatMessage(sessionId: string, content: string) {
  return apiPost<ChatMessage>(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    { content },
  );
}
