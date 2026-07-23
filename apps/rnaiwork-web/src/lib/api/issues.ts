import { fetchAPI, apiPost, apiPut, apiDelete } from "./client";
import type {
  Comment,
  CreateIssueInput,
  Issue,
  IssuePriority,
  IssueStatus,
  TimelineEvent,
  UpdateIssueInput,
} from "./types";

export interface ListIssuesParams {
  status?: IssueStatus;
  assignee_id?: string;
  project_id?: string;
}

function buildQuery(params?: ListIssuesParams) {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.assignee_id) qs.set("assignee_id", params.assignee_id);
  if (params.project_id) qs.set("project_id", params.project_id);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function listIssues(params?: ListIssuesParams): Promise<Issue[]> {
  const res = await fetchAPI<{ issues: Issue[]; total: number }>(`/api/issues${buildQuery(params)}`);
  return res?.issues ?? [];
}

export function getIssue(id: string) {
  return fetchAPI<Issue>(`/api/issues/${encodeURIComponent(id)}`);
}

export function createIssue(data: CreateIssueInput) {
  return apiPost<Issue>("/api/issues", data);
}

export function updateIssue(id: string, data: UpdateIssueInput) {
  return apiPut<Issue>(`/api/issues/${encodeURIComponent(id)}`, data);
}

export function deleteIssue(id: string) {
  return apiDelete<void>(`/api/issues/${encodeURIComponent(id)}`);
}

export function listComments(issueId: string) {
  return fetchAPI<Comment[]>(
    `/api/issues/${encodeURIComponent(issueId)}/comments`,
  );
}

export function createComment(issueId: string, content: string) {
  return apiPost<Comment>(
    `/api/issues/${encodeURIComponent(issueId)}/comments`,
    { content },
  );
}

export function listTimeline(issueId: string) {
  return fetchAPI<TimelineEvent[]>(
    `/api/issues/${encodeURIComponent(issueId)}/timeline`,
  );
}

/** Metadata helpers for rendering. */
export const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRIORITY_OPTIONS: {
  value: IssuePriority;
  label: string;
}[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
