import { fetchAPI, apiPost } from "./client";
import type { Member, Workspace } from "./types";

export function listWorkspaces() {
  return fetchAPI<Workspace[]>("/api/workspaces");
}

export function createWorkspace(data: {
  name: string;
  slug?: string;
  description?: string;
}) {
  return apiPost<Workspace>("/api/workspaces", data);
}

export function listMembers(slug: string) {
  return fetchAPI<Member[]>(`/api/workspaces/${encodeURIComponent(slug)}/members`);
}
