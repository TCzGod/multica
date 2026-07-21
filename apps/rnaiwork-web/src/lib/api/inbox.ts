import { fetchAPI } from "./client";

export interface InboxItem {
  id: string;
  workspace_id: string;
  source: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export async function listInbox(): Promise<InboxItem[]> {
  return fetchAPI<InboxItem[]>("/api/inbox");
}

export async function getInboxItem(id: string): Promise<InboxItem> {
  return fetchAPI<InboxItem>(`/api/inbox/${id}`);
}

export async function updateInboxItem(id: string, data: Partial<InboxItem>): Promise<InboxItem> {
  return fetchAPI<InboxItem>(`/api/inbox/${id}`, { method: "PUT", body: data });
}

export async function deleteInboxItem(id: string): Promise<void> {
  await fetchAPI<void>(`/api/inbox/${id}`, { method: "DELETE" });
}