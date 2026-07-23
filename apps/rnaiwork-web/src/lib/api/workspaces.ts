import { fetchAPI, apiPost, getWorkspaceContext } from "./client";
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

export function listMembers(_slug?: string) {
  const ctx = getWorkspaceContext();
  const workspaceId = ctx.id ?? _slug;
  if (!workspaceId) throw new Error("workspace_id is required");
  return fetchAPI<Member[]>(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`);
}
