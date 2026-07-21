import { fetchAPI } from "./client";

export interface Autopilot {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listAutopilots(): Promise<Autopilot[]> {
  return fetchAPI<Autopilot[]>("/api/autopilots");
}

export async function getAutopilot(id: string): Promise<Autopilot> {
  return fetchAPI<Autopilot>(`/api/autopilots/${id}`);
}

export async function createAutopilot(data: {
  name: string;
  description?: string;
}): Promise<Autopilot> {
  return fetchAPI<Autopilot>("/api/autopilots", { method: "POST", body: data });
}

export async function updateAutopilot(id: string, data: Partial<Autopilot>): Promise<Autopilot> {
  return fetchAPI<Autopilot>(`/api/autopilots/${id}`, { method: "PUT", body: data });
}

export async function deleteAutopilot(id: string): Promise<void> {
  await fetchAPI<void>(`/api/autopilots/${id}`, { method: "DELETE" });
}