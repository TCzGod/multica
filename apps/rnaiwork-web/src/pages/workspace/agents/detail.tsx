/**
 * Agent detail page.
 *
 * Renders a single agent with tabbed sections for overview, instructions,
 * skills, environment, and task history. Editing the name / instructions
 * writes through updateAgent; skills and env use their dedicated endpoints.
 * Archive/Restore toggles the agent's soft-delete flag.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  Spinner,
  Textarea,
  type TabItem,
  type SelectOption,
  Select,
} from "@/components/ui";
import { Tabs } from "@/components/ui";
import {
  archiveAgent,
  getAgent,
  getAgentEnv,
  listAgentSkills,
  listAgentTasks,
  restoreAgent,
  setAgentSkills,
  updateAgent,
  updateAgentEnv,
} from "@/lib/api/agents";
import { listSkills } from "@/lib/api/skills";
import { ApiError } from "@/lib/api/client";
import type { Agent, Skill, TaskRun } from "@/lib/api/types";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { ProviderBadge, providerLabel } from "./provider-badge";

type TabValue = "overview" | "instructions" | "skills" | "environment" | "tasks";

const TABS: TabItem[] = [
  { value: "overview", label: "Overview" },
  { value: "instructions", label: "Instructions" },
  { value: "skills", label: "Skills" },
  { value: "environment", label: "Environment" },
  { value: "tasks", label: "Tasks" },
];

/** Sentinel the backend uses to mask secret values it doesn't reveal. */
const ENV_SENTINEL = "****";

export default function AgentDetailPage() {
  const { agentId, workspaceSlug } = useParams<{ agentId: string; workspaceSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabValue>("overview");

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId!),
    enabled: !!agentId,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveAgent(agentId!),
    onSuccess: () => {
      toast.success("Agent archived");
      void queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to archive"),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreAgent(agentId!),
    onSuccess: () => {
      toast.success("Agent restored");
      void queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to restore"),
  });

  function backToList() {
    if (workspaceSlug) navigate(`/${workspaceSlug}/agents`);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <EmptyState
        icon={<X className="h-8 w-8" />}
        title="Agent not found"
        description={
          error instanceof ApiError
            ? error.message
            : "This agent may have been deleted."
        }
        action={
          <Button variant="ghost" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            Back to agents
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {agent.archived_at ? (
          <Button
            variant="outline"
            onClick={() => restoreMutation.mutate()}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArchiveRestore className="h-4 w-4" />
            )}
            Restore
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Archive
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="mt-4 flex items-start gap-4">
        <Avatar src={agent.avatar_url} name={agent.name} size="lg" />
        <div className="min-w-0 flex-1">
          <AgentNameField agent={agent} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProviderBadge provider={agent.provider} />
            <Badge variant="outline">
              {agent.runtime_id ? "Has runtime" : "No runtime"}
            </Badge>
            {agent.archived_at ? (
              <Badge variant="outline">Archived</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex-1 overflow-hidden">
        <Tabs tabs={TABS} value={tab} onChange={(v) => setTab(v as TabValue)}>
          <div className="max-h-[calc(100vh-20rem)] overflow-auto pb-6">
            {tab === "overview" && <OverviewTab agent={agent} />}
            {tab === "instructions" && <InstructionsTab agent={agent} />}
            {tab === "skills" && <SkillsTab agentId={agent.id} />}
            {tab === "environment" && <EnvironmentTab agentId={agent.id} />}
            {tab === "tasks" && <TasksTab agentId={agent.id} />}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// --- Name field (inline editable) -----------------------------------------

function AgentNameField({ agent }: { agent: Agent }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(agent.name);

  useEffect(() => {
    setValue(agent.name);
  }, [agent.name]);

  const saveMutation = useMutation({
    mutationFn: () => updateAgent(agent.id, { name: value.trim() }),
    onSuccess: () => {
      toast.success("Name updated");
      void queryClient.invalidateQueries({ queryKey: ["agent", agent.id] });
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
      setEditing(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update"),
  });

  function commit() {
    if (!value.trim() || value.trim() === agent.name) {
      setEditing(false);
      return;
    }
    saveMutation.mutate();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {agent.name}
        </h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(agent.name);
            setEditing(false);
          }
        }}
        autoFocus
        className="max-w-sm text-lg font-semibold"
      />
      <Button size="icon" variant="ghost" onClick={commit} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setValue(agent.name);
          setEditing(false);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// --- Overview --------------------------------------------------------------

function OverviewTab({ agent }: { agent: Agent }) {
  const { data: tasksData } = useQuery({
    queryKey: ["agent-tasks", agent.id],
    queryFn: () => listAgentTasks(agent.id),
    staleTime: 30_000,
  });

  const tasks = Array.isArray(tasksData) ? tasksData : [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard title="Basic info">
          <InfoRow label="Provider" value={providerLabel(agent.provider)} />
          <InfoRow label="Status" value={agent.archived_at ? "Archived" : "Active"} />
          <InfoRow label="Created" value={formatDate(agent.created_at)} />
          <InfoRow label="Updated" value={formatDate(agent.updated_at)} />
        </InfoCard>

        <InfoCard title="Runtime">
          {agent.runtime_id ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Runtime assigned (ID: {agent.runtime_id.slice(0, 8)}...)
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              No runtime assigned.
            </p>
          )}
        </InfoCard>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Recent tasks
        </h3>
        <TaskList tasks={tasks} emptyHint="No task runs yet." limit={5} />
      </section>
    </div>
  );
}

// --- Instructions ----------------------------------------------------------

function InstructionsTab({ agent }: { agent: Agent }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(agent.instructions ?? "");

  useEffect(() => {
    setValue(agent.instructions ?? "");
  }, [agent.instructions]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAgent(agent.id, { instructions: value }),
    onSuccess: () => {
      toast.success("Instructions saved");
      void queryClient.invalidateQueries({ queryKey: ["agent", agent.id] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save"),
  });

  const dirty = value !== (agent.instructions ?? "");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          Instructions are sent to the provider as the system prompt.
        </p>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe how this agent should behave, its goals, and constraints…"
        className="min-h-[320px] font-mono text-xs"
      />
    </div>
  );
}

// --- Skills ----------------------------------------------------------------

function SkillsTab({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ["agent-skills", agentId],
    queryFn: () => listAgentSkills(agentId),
  });

  const { data: allSkillsData, isLoading: allLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: listSkills,
  });

  const assigned = Array.isArray(assignedData) ? assignedData : [];
  const allSkills = Array.isArray(allSkillsData) ? allSkillsData : [];

  const assignedIds = useMemo(() => new Set(assigned.map((s) => s.id)), [assigned]);
  const unassigned = useMemo(
    () => allSkills.filter((s) => !assignedIds.has(s.id)),
    [allSkills, assignedIds],
  );

  const [addSkillId, setAddSkillId] = useState("");

  const setMutation = useMutation({
    mutationFn: (ids: string[]) => setAgentSkills(agentId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["agent-skills", agentId] });
      const prev = queryClient.getQueryData<Skill[]>(["agent-skills", agentId]);
      const next = allSkills.filter((s) => ids.includes(s.id));
      queryClient.setQueryData(["agent-skills", agentId], next);
      return { prev };
    },
    onError: (_e, _ids, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["agent-skills", agentId], ctx.prev);
      toast.error("Failed to update skills");
    },
    onSuccess: () => toast.success("Skills updated"),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-skills", agentId] });
    },
  });

  function addSkill() {
    if (!addSkillId) return;
    setMutation.mutate([...assignedIds, addSkillId]);
    setAddSkillId("");
  }

  function removeSkill(id: string) {
    setMutation.mutate([...assignedIds].filter((x) => x !== id));
  }

  const addOptions: SelectOption[] = unassigned.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  if (assignedLoading || allLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">
            Add skill
          </label>
          <Select
            value={addSkillId}
            onChange={setAddSkillId}
            options={addOptions}
            placeholder="Select a skill"
          />
        </div>
        <Button onClick={addSkill} disabled={!addSkillId || setMutation.isPending}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {assigned.length === 0 ? (
        <EmptyState
          title="No skills assigned"
          description="Skills add reusable capabilities to this agent."
        />
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          {assigned.map((skill) => (
            <li
              key={skill.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">
                  {skill.name}
                </p>
                {skill.description && (
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {skill.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(skill.id)}
                disabled={setMutation.isPending}
                aria-label={`Remove ${skill.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Environment -----------------------------------------------------------

interface EnvRow {
  key: string;
  value: string;
}

function EnvironmentTab({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<EnvRow[]>([]);

  const { data: env, isLoading, error } = useQuery({
    queryKey: ["agent-env", agentId],
    queryFn: () => getAgentEnv(agentId),
  });

  // Sync fetched env into local rows. Skips while a save-triggered refetch
  // is in-flight so in-progress edits aren't clobbered.
  useEffect(() => {
    if (!env) return;
    setRows(
      Object.entries(env).map(([key, value]) => ({ key, value })),
    );
  }, [env]);

  const saveMutation = useMutation({
    mutationFn: (newEnv: Record<string, string>) => updateAgentEnv(agentId, newEnv),
    onSuccess: () => {
      toast.success("Environment saved");
      void queryClient.invalidateQueries({ queryKey: ["agent-env", agentId] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save"),
  });

  function updateRow(idx: number, patch: Partial<EnvRow>) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function buildEnv(): Record<string, string> {
    const newEnv: Record<string, string> = {};
    for (const r of rows) {
      const key = r.key.trim();
      if (!key) continue;
      newEnv[key] = r.value;
    }
    return newEnv;
  }

  function save() {
    saveMutation.mutate(buildEnv());
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load environment"
        description={error instanceof ApiError ? error.message : undefined}
      />
    );
  }

  const maskedCount = rows.filter((r) => r.value === ENV_SENTINEL).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          Custom environment variables passed to the agent at runtime.
          {maskedCount > 0 && (
            <span className="ml-1 text-[var(--color-warning)]">
              ({maskedCount} masked value{maskedCount === 1 ? "" : "s"} preserved)
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Add variable
          </Button>
          <Button size="sm" onClick={save} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No environment variables"
          description="Add a variable to configure the agent's runtime environment."
          action={
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" />
              Add variable
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={row.key}
                onChange={(e) => updateRow(idx, { key: e.target.value })}
                placeholder="KEY"
                className="font-mono text-xs"
              />
              <Input
                value={row.value}
                onChange={(e) => updateRow(idx, { value: e.target.value })}
                placeholder={ENV_SENTINEL}
                className={cn(
                  "font-mono text-xs",
                  row.value === ENV_SENTINEL && "text-[var(--color-warning)]",
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(idx)}
                aria-label="Remove variable"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Tasks -----------------------------------------------------------------

function TasksTab({ agentId }: { agentId: string }) {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["agent-tasks", agentId],
    queryFn: () => listAgentTasks(agentId),
  });

  const tasks = Array.isArray(tasksData) ? tasksData : [];

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <TaskList
      tasks={tasks}
      emptyHint="This agent hasn't run any tasks yet."
    />
  );
}

function TaskList({
  tasks,
  emptyHint,
  limit,
}: {
  tasks: TaskRun[];
  emptyHint: string;
  limit?: number;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState title="No tasks" description={emptyHint} />
    );
  }

  const shown = limit ? tasks.slice(0, limit) : tasks;

  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {shown.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-[var(--color-text-muted)]">
              {task.id}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-subtle)]">
              Started {formatRelativeTime(task.started_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)]">
              Issue {task.issue_id.slice(0, 8)}
            </span>
            <TaskStatusBadge status={task.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const variant =
    status === "completed" || status === "succeeded"
      ? "success"
      : status === "failed" || status === "error"
        ? "danger"
        : status === "cancelled" || status === "canceled"
          ? "warning"
          : "default";
  return <Badge variant={variant}>{status}</Badge>;
}

// --- Shared bits -----------------------------------------------------------

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {title}
      </h4>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-[var(--color-text-muted)]">{label}</dt>
      <dd className="text-right text-sm text-[var(--color-text)]">{value}</dd>
    </div>
  );
}
