/**
 * Workspace dashboard page.
 *
 * Overview composed of three sections:
 *  - Stat cards: total issues, open issues, active agents, active runs.
 *  - Recent issues: the five most recently created issues.
 *  - Active agents: non-archived agents in the workspace.
 *
 * Data is sourced from existing endpoints (issues, agents, and the
 * workspace agent-task snapshot for active runs). Each query is independent
 * so a slow or failing section never blocks the others.
 *
 * Rendered at /:workspaceSlug (root redirects here) — see src/router/index.tsx.
 */
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  CircleDot,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { fetchAPI } from "@/lib/api/client";
import { listAgents } from "@/lib/api/agents";
import { listIssues } from "@/lib/api/issues";
import type { Agent, Issue } from "@/lib/api/types";
import { useWorkspaceStore } from "@/stores/workspace";
import { StatusBadge } from "@/pages/workspace/issues/status-badge";

/** Issue statuses considered "open" (not done / not cancelled). */
const OPEN_STATUSES = new Set(["backlog", "todo", "in_progress", "in_review"]);

/** Task statuses that count as an in-flight agent run. Mirrors the snapshot
 *  query's active set in server/pkg/db/queries/agent.sql. */
const ACTIVE_RUN_STATUSES = new Set([
  "queued",
  "dispatched",
  "running",
  "waiting_local_directory",
]);

/** Minimal shape of an entry from GET /api/agent-task-snapshot. */
interface AgentTask {
  id: string;
  agent_id: string;
  status: string;
  started_at?: string | null;
}

export default function DashboardPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();

  const issuesQuery = useQuery({ queryKey: ["issues"], queryFn: () => listIssues() });
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: () => listAgents() });
  const runsQuery = useQuery({
    queryKey: ["agent-task-snapshot"],
    queryFn: () => fetchAPI<AgentTask[]>("/api/agent-task-snapshot"),
  });

  const stats = useMemo(() => {
    const issues = Array.isArray(issuesQuery.data) ? issuesQuery.data : [];
    const agents = Array.isArray(agentsQuery.data) ? agentsQuery.data : [];
    const tasks = Array.isArray(runsQuery.data) ? runsQuery.data : [];
    return {
      totalIssues: issues.length,
      openIssues: issues.filter((i) => OPEN_STATUSES.has(i.status)).length,
      activeAgents: agents.filter((a) => !a.is_archived).length,
      activeRuns: tasks.filter((t) => ACTIVE_RUN_STATUSES.has(t.status)).length,
    };
  }, [issuesQuery.data, agentsQuery.data, runsQuery.data]);

  const recentIssues = useMemo(() => {
    const issues = Array.isArray(issuesQuery.data) ? issuesQuery.data : [];
    return [...issues]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);
  }, [issuesQuery.data]);

  const activeAgents = useMemo(
    () => (Array.isArray(agentsQuery.data) ? agentsQuery.data : []).filter((a) => !a.is_archived).slice(0, 8),
    [agentsQuery.data],
  );

  const statsLoading = issuesQuery.isLoading || agentsQuery.isLoading || runsQuery.isLoading;

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {currentWorkspace?.name ?? "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            An overview of activity in this workspace
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total issues"
            value={stats.totalIssues}
            icon={ListChecks}
            loading={issuesQuery.isLoading}
          />
          <StatCard
            label="Open issues"
            value={stats.openIssues}
            icon={CircleDot}
            loading={issuesQuery.isLoading}
          />
          <StatCard
            label="Active agents"
            value={stats.activeAgents}
            icon={Bot}
            loading={agentsQuery.isLoading}
          />
          <StatCard
            label="Active runs"
            value={stats.activeRuns}
            icon={Activity}
            loading={runsQuery.isLoading}
          />
        </div>

        {/* Two-column lower section */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent issues */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent issues</CardTitle>
              {workspaceSlug && (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => navigate(`/${workspaceSlug}/issues`)}
                >
                  View all
                </Button>
              )}
            </CardHeader>
            <CardBody className="pt-0">
              {issuesQuery.isLoading ? (
                <SectionLoading label="Loading issues..." />
              ) : issuesQuery.isError ? (
                <SectionError
                  message={
                    issuesQuery.error instanceof Error
                      ? issuesQuery.error.message
                      : "Failed to load issues"
                  }
                  onRetry={() => issuesQuery.refetch()}
                />
              ) : recentIssues.length === 0 ? (
                <EmptyState
                  icon={<CircleDot className="h-8 w-8" />}
                  title="No issues yet"
                  description="Issues you create will show up here."
                />
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {recentIssues.map((issue) => (
                    <RecentIssueRow
                      key={issue.id}
                      issue={issue}
                      onOpen={() =>
                        workspaceSlug &&
                        navigate(`/${workspaceSlug}/issues/${issue.id}`)
                      }
                    />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Active agents */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Active agents</CardTitle>
              {workspaceSlug && (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => navigate(`/${workspaceSlug}/agents`)}
                >
                  View all
                </Button>
              )}
            </CardHeader>
            <CardBody className="pt-0">
              {agentsQuery.isLoading ? (
                <SectionLoading label="Loading agents..." />
              ) : agentsQuery.isError ? (
                <SectionError
                  message={
                    agentsQuery.error instanceof Error
                      ? agentsQuery.error.message
                      : "Failed to load agents"
                  }
                  onRetry={() => agentsQuery.refetch()}
                />
              ) : activeAgents.length === 0 ? (
                <EmptyState
                  icon={<Bot className="h-8 w-8" />}
                  title="No active agents"
                  description="Create an agent to start automating work."
                />
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {activeAgents.map((agent) => (
                    <ActiveAgentRow
                      key={agent.id}
                      agent={agent}
                      onOpen={() =>
                        workspaceSlug &&
                        navigate(`/${workspaceSlug}/agents/${agent.id}`)
                      }
                    />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {statsLoading && (
        <span className="sr-only" aria-live="polite">
          Loading dashboard data
        </span>
      )}
    </div>
  );
}

// --- Stat card --------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading: boolean;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-accent)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-subtle)]">
            {label}
          </p>
          {loading ? (
            <div className="mt-1 h-6 w-10 animate-pulse rounded bg-[var(--color-surface-2)]" />
          ) : (
            <p className="text-2xl font-semibold text-[var(--color-text)]">
              {value}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// --- Rows -------------------------------------------------------------------

function RecentIssueRow({
  issue,
  onOpen,
}: {
  issue: Issue;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <span className="shrink-0 text-xs text-[var(--color-text-subtle)]">
          #{issue.number}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)]">
          {issue.title}
        </span>
        {issue.assignee && (
          <Avatar
            src={issue.assignee.avatar_url}
            name={issue.assignee.name}
            size="sm"
          />
        )}
        <StatusBadge status={issue.status} />
      </button>
    </li>
  );
}

function ActiveAgentRow({
  agent,
  onOpen,
}: {
  agent: Agent;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <Avatar src={agent.avatar_url} name={agent.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text)]">
            {agent.name}
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {agent.runtime?.name ?? "No runtime"}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {agent.provider}
        </Badge>
      </button>
    </li>
  );
}

// --- Section helpers --------------------------------------------------------

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
      <Spinner size="sm" />
      {label}
    </div>
  );
}

function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm text-[var(--color-danger)]">{message}</p>
      <Button variant="outline" className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
