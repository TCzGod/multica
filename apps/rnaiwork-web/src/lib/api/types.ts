/**
 * TypeScript type definitions for the RNAIWork backend API.
 *
 * These mirror the JSON shapes returned by the Go handlers in
 * server/internal/handler/. Optional fields use `?` to match the
 * backend's `omitempty` / pointer semantics — callers should guard
 * against `undefined` when reading them.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  onboarding_completed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  role: string;
}

export interface Member {
  id: string;
  user_id: string;
  role: string;
  user: User;
}

export interface Issue {
  id: string;
  workspace_id: string;
  number: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee_id?: string;
  assignee?: Agent;
  project_id?: string;
  project?: Project;
  labels: Label[];
  created_at: string;
  updated_at: string;
  parent_id?: string;
  children_count?: number;
}

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  avatar_url?: string;
  provider: string;
  runtime_id?: string;
  runtime?: AgentRuntime;
  instructions?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentRuntime {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  hostname?: string;
  available_clis?: string[];
  last_seen_at?: string;
  is_online: boolean;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  color?: string;
  issue_count?: number;
  created_at: string;
}

export interface Skill {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface Squad {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  leader_agent_id?: string;
  members?: SquadMember[];
  created_at: string;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  member_type: string;
  member_id: string;
  role: string;
}

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_type: string;
  author_id: string;
  author?: User | Agent;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  is_resolved: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface Autopilot {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  agent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  inviter: User;
  workspace: Workspace;
  status: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  issue_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string;
  content: string;
  created_at: string;
}

export interface TaskRun {
  id: string;
  issue_id: string;
  agent_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
}

export interface AppConfig {
  cdn_domain: string;
  allow_signup: boolean;
  daemon_server_url: string;
  daemon_app_url: string;
}
