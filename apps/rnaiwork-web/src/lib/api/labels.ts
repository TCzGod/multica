import { fetchAPI } from "./client";
import type { Label } from "./types";

export async function listLabels(): Promise<Label[]> {
  return fetchAPI<Label[]>("/api/labels");
}

export async function getLabel(id: string): Promise<Label> {
  return fetchAPI<Label>(`/api/labels/${id}`);
}

export async function createLabel(data: {
  name: string;
  color: string;
}): Promise<Label> {
  return fetchAPI<Label>("/api/labels", { method: "POST", body: data });
}

export async function updateLabel(id: string, data: Partial<Label>): Promise<Label> {
  return fetchAPI<Label>(`/api/labels/${id}`, { method: "PUT", body: data });
}

export async function deleteLabel(id: string): Promise<void> {
  await fetchAPI<void>(`/api/labels/${id}`, { method: "DELETE" });
}