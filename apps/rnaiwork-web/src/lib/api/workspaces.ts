/**
 * Workspace, member, and invitation API functions.
 *
 * Workspace CRUD routes (/api/workspaces) are user-scoped (the workspace
 * ID comes from the URL path, not the header). Member sub-routes resolve
 * the workspace from the chi URL param. Invitation list/accept/decline
 * routes are user-scoped.
 */
import { fetchAPI } from "./client";
import type { Invitation, Member, Workspace } from "./types";

// --- Workspaces ------------------------------------------------------------

/** GET /api/workspaces — list workspaces the current user is a member of. */
export async function listWorkspaces(): Promise<Workspace[]> {
  return fetchAPI<Workspace[]>("/api/workspaces");
}

/** POST /api/workspaces — create a new workspace. */
export async function createWorkspace(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Workspace> {
  return fetchAPI<Workspace>("/api/workspaces", { method: "POST", body: data });
}

/** GET /api/workspaces/{id} — fetch a single workspace. */
export async function getWorkspace(id: string): Promise<Workspace> {
  return fetchAPI<Workspace>(`/api/workspaces/${id}`);
}

/** PUT /api/workspaces/{id} — update workspace fields. Admin/owner only. */
export async function updateWorkspace(
  id: string,
  data: Partial<Workspace>,
): Promise<Workspace> {
  return fetchAPI<Workspace>(`/api/workspaces/${id}`, {
    method: "PUT",
    body: data,
  });
}

/** DELETE /api/workspaces/{id} — permanently delete a workspace. Owner only. */
export async function deleteWorkspace(id: string): Promise<void> {
  await fetchAPI<void>(`/api/workspaces/${id}`, { method: "DELETE" });
}

// --- Members ---------------------------------------------------------------

/** GET /api/workspaces/{id}/members — list workspace members with user info. */
export async function listMembers(workspaceId: string): Promise<Member[]> {
  return fetchAPI<Member[]>(`/api/workspaces/${workspaceId}/members`);
}

/** POST /api/workspaces/{id}/members — invite a user by email with a role.
 *  Creates a pending invitation; the invitee accepts via /api/invitations. */
export async function createInvitation(
  workspaceId: string,
  email: string,
  role: string,
): Promise<Invitation> {
  return fetchAPI<Invitation>(`/api/workspaces/${workspaceId}/members`, {
    method: "POST",
    body: { email, role },
  });
}

/** PATCH /api/workspaces/{id}/members/{memberId} — change a member's role. */
export async function updateMember(
  workspaceId: string,
  memberId: string,
  role: string,
): Promise<void> {
  await fetchAPI<void>(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PATCH",
    body: { role },
  });
}

/** DELETE /api/workspaces/{id}/members/{memberId} — remove a member from
 *  the workspace. */
export async function deleteMember(
  workspaceId: string,
  memberId: string,
): Promise<void> {
  await fetchAPI<void>(
    `/api/workspaces/${workspaceId}/members/${memberId}`,
    { method: "DELETE" },
  );
}

// --- Invitations (user-scoped) ---------------------------------------------

/** GET /api/invitations — list pending invitations for the current user. */
export async function listInvitations(): Promise<Invitation[]> {
  return fetchAPI<Invitation[]>("/api/invitations");
}

/** POST /api/invitations/{id}/accept — accept a workspace invitation. */
export async function acceptInvitation(id: string): Promise<void> {
  await fetchAPI<void>(`/api/invitations/${id}/accept`, { method: "POST" });
}

/** POST /api/invitations/{id}/decline — decline a workspace invitation. */
export async function declineInvitation(id: string): Promise<void> {
  await fetchAPI<void>(`/api/invitations/${id}/decline`, { method: "POST" });
}
