import { fetchAPI } from "./client";

export interface ChatSession {
  id: string;
  workspace_id: string;
  agent_id?: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  return fetchAPI<ChatSession[]>("/api/chat/sessions");
}

export async function getChatSession(id: string): Promise<ChatSession> {
  return fetchAPI<ChatSession>(`/api/chat/sessions/${id}`);
}

export async function createChatSession(data: {
  agent_id?: string;
  name?: string;
}): Promise<ChatSession> {
  return fetchAPI<ChatSession>("/api/chat/sessions", { method: "POST", body: data });
}

export async function deleteChatSession(id: string): Promise<void> {
  await fetchAPI<void>(`/api/chat/sessions/${id}`, { method: "DELETE" });
}

export async function getChatThread(sessionId: string): Promise<any> {
  return fetchAPI(`/api/chat/thread?session_id=${sessionId}`);
}