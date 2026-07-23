/* ------------------------------------------------------------------ */
/* Domain types — mirror the backend shapes described in the API spec. */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  onboarded_at: string | null;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
}

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

export type IssuePriority = "none" | "low" | "medium" | "high" | "urgent";

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  assignee_id: string | null;
  assignee_type: string | null;
  project_id: string | null;
  number?: number;
  identifier?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  assignee_type?: string | null;
  project_id?: string | null;
  priority?: IssuePriority;
  status?: IssueStatus;
}

export type UpdateIssueInput = Partial<CreateIssueInput>;

export interface Comment {
  id: string;
  issue_id: string;
  content: string;
  author_id: string;
  author_name?: string;
  author_avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type TimelineEventType =
  | "created"
  | "status_changed"
  | "assignee_changed"
  | "priority_changed"
  | "commented"
  | "updated";

export interface TimelineEvent {
  id: string;
  issue_id: string;
  type: TimelineEventType | string;
  actor_id?: string;
  actor_name?: string;
  field?: string;
  old_value?: string | null;
  new_value?: string | null;
  content?: string;
  created_at: string;
}

export type AgentProvider = string;

export interface Agent {
  id: string;
  name: string;
  provider: string;
  runtime_id?: string | null;
  instructions?: string | null;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentInput {
  name: string;
  provider: string;
  runtime_id?: string | null;
  instructions?: string | null;
}

export type UpdateAgentInput = Partial<CreateAgentInput>;

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  status?: string;
  priority?: string;
  issue_count?: number;
  done_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string | null;
  icon?: string;
  status?: string;
  priority?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  agent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateChatSessionInput {
  agent_id?: string | null;
  title?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
}

export interface WorkspaceContext {
  slug: string | null;
  id: string | null;
}
