export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  onboarded_at?: string;
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
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface IssueResponse {
  id: string;
  workspace_id: string;
  number: number;
  identifier: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee_type?: string;
  assignee_id?: string;
  creator_type: string;
  creator_id: string;
  parent_issue_id?: string;
  project_id?: string;
  position: number;
  stage?: number;
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  reactions?: any[];
  attachments?: any[];
  labels?: Label[];
}

export type Issue = IssueResponse;

export interface AgentResponse {
  id: string;
  workspace_id: string;
  runtime_id?: string;
  name: string;
  provider: string;
  description?: string;
  instructions?: string;
  avatar_url?: string;
  runtime_mode: string;
  runtime_config: any;
  custom_args: string[];
  has_custom_env: boolean;
  custom_env_key_count: number;
  visibility: string;
  permission_mode: string;
  status: string;
  max_concurrent_tasks: number;
  model: string;
  thinking_level: string;
  owner_id?: string;
  skills: any[];
  created_at: string;
  updated_at: string;
  archived_at?: string;
  archived_by?: string;
}

export type Agent = AgentResponse;

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

export interface ProjectResponse {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  icon?: string;
  status: string;
  priority: string;
  lead_type?: string;
  lead_id?: string;
  created_at: string;
  updated_at: string;
  issue_count: number;
  done_count: number;
  resource_count: number;
}

export type Project = ProjectResponse;

export interface Skill {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  content?: string;
  created_at: string;
  updated_at: string;
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

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  inviter: User;
  workspace: Workspace;
  status: string;
  created_at: string;
}

export interface AppConfig {
  cdn_domain: string;
  allow_signup: boolean;
  daemon_server_url: string;
  daemon_app_url: string;
}