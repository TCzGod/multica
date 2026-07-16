/**
 * Agent list page.
 *
 * Renders a filterable grid of agent cards. Clicking a card navigates to
 * /:workspaceSlug/agents/:agentId. Uses TanStack Query for data fetching
 * and cache invalidation shared with the create / detail flows.
 */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Plus } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { listAgentTasks, listAgents } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn, formatDate } from "@/lib/utils";
import { ProviderBadge } from "./provider-badge";
import { CreateAgentDialog } from "./create-dialog";

type AgentFilter = "all" | "active" | "archived";

const FILTERS: { value: AgentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function AgentsPage() {
  const navigate = useNavigate();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace } = useWorkspaceStore();

  const [filter, setFilter] = useState<AgentFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: agentsData, isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: listAgents,
  });

  const agents = Array.isArray(agentsData) ? agentsData : [];

  const filtered = useMemo(() => {
    switch (filter) {
      case "active":
        return agents.filter((a) => !a.archived_at);
      case "archived":
        return agents.filter((a) => a.archived_at);
      default:
        return agents;
    }
  }, [agents, filter]);

  const counts = useMemo(
    () => ({
      all: agents.length,
      active: agents.filter((a) => !a.archived_at).length,
      archived: agents.filter((a) => a.archived_at).length,
    }),
    [agents],
  );

  function openAgent(agentId: string) {
    if (!workspaceSlug) return;
    navigate(`/${workspaceSlug}/agents/${agentId}`);
  }

  return (
    <div className="flex h-full flex-col px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Agents
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {currentWorkspace?.name
              ? `${currentWorkspace.name} · `
              : ""}
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-1 w-fit">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {f.label}
              <span className="ml-1.5 text-[var(--color-text-subtle)]">
                {counts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="mt-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <EmptyState
            icon={<Bot className="h-8 w-8" />}
            title="Couldn't load agents"
            description={
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again."
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-10 w-10" />}
            title={agents.length === 0 ? "Create your first agent" : "No agents here"}
            description={
              agents.length === 0
                ? "Agents run tasks against your codebase using the provider and runtime you configure."
                : "No agents match this filter."
            }
            action={
              agents.length === 0 ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Agent
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onOpen={() => openAgent(agent.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateAgentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

// --- Agent card ------------------------------------------------------------

interface AgentCardProps {
  agent: Agent;
  onOpen: () => void;
}

/** Per-agent task count. Lives in its own component so the cheap card grid
 *  isn't blocked waiting for every agent's task list. */
function AgentTaskCount({ agentId }: { agentId: string }) {
  const { data } = useQuery({
    queryKey: ["agent-tasks", agentId],
    queryFn: () => listAgentTasks(agentId),
    staleTime: 60_000,
  });
  const count = data?.length ?? 0;
  return <span>{count} task{count === 1 ? "" : "s"}</span>;
}

function AgentCard({ agent, onOpen }: AgentCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition-colors hover:border-[var(--color-text-subtle)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <div className="flex items-start gap-3">
        <Avatar src={agent.avatar_url} name={agent.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
              {agent.name}
            </h3>
            {agent.archived_at ? (
              <Badge variant="outline" className="shrink-0">
                Archived
              </Badge>
            ) : (
              <Badge variant="success" className="shrink-0">
                Active
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
            {agent.runtime_id ? "Has runtime" : "No runtime"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ProviderBadge provider={agent.provider} />
        <span className="text-xs text-[var(--color-text-muted)]">
          <AgentTaskCount agentId={agent.id} />
        </span>
      </div>

      <div className="border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-subtle)]">
        Created {formatDate(agent.created_at)}
      </div>
    </button>
  );
}
