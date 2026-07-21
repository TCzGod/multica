import { fetchAPI } from "./client";

export interface Squad {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export async function listSquads(): Promise<Squad[]> {
  return fetchAPI<Squad[]>("/api/squads");
}

export async function getSquad(id: string): Promise<Squad> {
  return fetchAPI<Squad>(`/api/squads/${id}`);
}

export async function createSquad(data: {
  name: string;
  description?: string;
}): Promise<Squad> {
  return fetchAPI<Squad>("/api/squads", { method: "POST", body: data });
}

export async function updateSquad(id: string, data: Partial<Squad>): Promise<Squad> {
  return fetchAPI<Squad>(`/api/squads/${id}`, { method: "PUT", body: data });
}

export async function deleteSquad(id: string): Promise<void> {
  await fetchAPI<void>(`/api/squads/${id}`, { method: "DELETE" });
}