import { fetchAPI } from "./client";

export interface Attachment {
  id: string;
  workspace_id: string;
  issue_id?: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

export async function getAttachment(id: string): Promise<Attachment> {
  return fetchAPI<Attachment>(`/api/attachments/${id}`);
}

export async function deleteAttachment(id: string): Promise<void> {
  await fetchAPI<void>(`/api/attachments/${id}`, { method: "DELETE" });
}