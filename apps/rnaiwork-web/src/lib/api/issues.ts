/**
 * Issue API functions. All routes here are workspace-scoped — fetchAPI
 * injects the X-Workspace-Slug header from the active workspace context.
 *
 * Backend routes: server/cmd/server/router.go (r.Route("/api/issues", ...))
 */
import { fetchAPI } from "./client";
import type { Comment, Issue, TaskRun, TimelineEvent } from "./types";

export interface ListIssuesParams {
  status?: string;
  assignee_id?: string;
  project_id?: string;
  search?: string;
}

/** GET /api/issues — list issues, optionally filtered. Empty params returns
 *  all issues in the active workspace. */
export async function listIssues(
  params?: ListIssuesParams,
): Promise<Issue[]> {
  const search = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) search.set(k, String(v));
    }
  }
  const qs = search.toString();
  return fetchAPI<Issue[]>(`/api/issues${qs ? `?${qs}` : ""}`);
}

/** GET /api/issues/{id} — fetch a single issue with relations
 *  (assignee, project, labels). */
export async function getIssue(id: string): Promise<Issue> {
  return fetchAPI<Issue>(`/api/issues/${id}`);
}

/** POST /api/issues — create a new issue. */
export async function createIssue(data: {
  title: string;
  description?: string;
  assignee_id?: string;
  project_id?: string;
  priority?: string;
  status?: string;
  parent_id?: string;
}): Promise<Issue> {
  return fetchAPI<Issue>("/api/issues", { method: "POST", body: data });
}

/** PUT /api/issues/{id} — update issue fields. */
export async function updateIssue(
  id: string,
  data: Partial<Issue>,
): Promise<Issue> {
  return fetchAPI<Issue>(`/api/issues/${id}`, { method: "PUT", body: data });
}

/** DELETE /api/issues/{id} — permanently delete an issue. */
export async function deleteIssue(id: string): Promise<void> {
  await fetchAPI<void>(`/api/issues/${id}`, { method: "DELETE" });
}

// --- Comments --------------------------------------------------------------

/** GET /api/issues/{id}/comments — list comments on an issue. */
export async function listComments(issueId: string): Promise<Comment[]> {
  return fetchAPI<Comment[]>(`/api/issues/${issueId}/comments`);
}

/** POST /api/issues/{id}/comments — add a comment to an issue. */
export async function createComment(
  issueId: string,
  content: string,
): Promise<Comment> {
  return fetchAPI<Comment>(`/api/issues/${issueId}/comments`, {
    method: "POST",
    body: { content },
  });
}

// --- Timeline & task runs -------------------------------------------------

/** GET /api/issues/{id}/timeline — activity timeline for an issue. */
export async function listTimeline(issueId: string): Promise<TimelineEvent[]> {
  return fetchAPI<TimelineEvent[]>(`/api/issues/${issueId}/timeline`);
}

/** GET /api/issues/{id}/task-runs — execution history for an issue. */
export async function listTaskRuns(issueId: string): Promise<TaskRun[]> {
  return fetchAPI<TaskRun[]>(`/api/issues/${issueId}/task-runs`);
}

/** POST /api/issues/{id}/rerun — trigger a fresh agent run for the issue. */
export async function rerunIssue(id: string): Promise<void> {
  await fetchAPI<void>(`/api/issues/${id}/rerun`, { method: "POST" });
}
