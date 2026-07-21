import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Archive, Plus, RotateCcw } from "lucide-react";
import {
  archiveAgent,
  getAgent,
  restoreAgent,
  updateAgent,
} from "@/lib/api/agents";
import {
  createIssue,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "@/lib/api/issues";
import { queryKeys } from "@/lib/query-keys";
import type { IssuePriority, IssueStatus } from "@/lib/api/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AgentDetailPage() {
  const { agentId, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const agentQ = useQuery({
    queryKey: queryKeys.agent(agentId!),
    queryFn: () => getAgent(agentId!),
    enabled: !!agentId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agents"] });
    if (agentId)
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(agentId) });
  };

  const updateMut = useMutation({
    mutationFn: (data: { id: string } & Record<string, unknown>) =>
      updateAgent(data.id, data as never),
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Update failed"),
  });
  const archiveMut = useMutation({
    mutationFn: archiveAgent,
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Archive failed"),
  });
  const restoreMut = useMutation({
    mutationFn: restoreAgent,
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Restore failed"),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const createIssueMut = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      assignee_id: string;
      status?: IssueStatus;
      priority?: IssuePriority;
    }) => createIssue(data),
    onSuccess: (issue) => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success("Issue created");
      setCreateOpen(false);
      navigate(`/${workspaceSlug}/issues/${issue.id}`);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to create issue",
      ),
  });

  if (agentQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (agentQ.isError || !agentQ.data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Agent not found"
          description="This agent may have been deleted."
        />
      </div>
    );
  }

  const agent = agentQ.data;

  return (
    <div className="space-y-4 p-6">
      <Link
        to={`/${workspaceSlug}/agents`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
      >
        <ArrowLeft className="size-4" />
        Back to agents
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text">{agent.name}</h1>
          <Badge variant="secondary">{agent.provider}</Badge>
          {agent.is_archived ? (
            <Badge variant="outline">Archived</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={agent.is_archived || createIssueMut.isPending}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            Create issue
          </Button>
          {agent.is_archived ? (
            <Button
              variant="outline"
              disabled={restoreMut.isPending}
              onClick={() => restoreMut.mutate(agent.id)}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={archiveMut.isPending}
              onClick={() => archiveMut.mutate(agent.id)}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <AgentEditForm
        agent={agent}
        saving={updateMut.isPending}
        onSave={(data) => updateMut.mutate({ id: agent.id, ...data })}
      />

      <AgentCreateIssueDialog
        open={createOpen}
        agentName={agent.name}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) =>
          createIssueMut.mutate({ ...data, assignee_id: agent.id })
        }
        submitting={createIssueMut.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create-issue dialog — assigns the new issue to this agent.         */
/* ------------------------------------------------------------------ */

function AgentCreateIssueDialog({
  open,
  agentName,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  agentName: string;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
  }) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("backlog");
  const [priority, setPriority] = useState<IssuePriority>("medium");

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Create issue for {agentName}</DialogTitle>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <Input
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          placeholder="Describe the task for this agent…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">Priority</label>
            <Select
              value={priority ?? ""}
              onChange={(e) =>
                setPriority((e.target.value || null) as IssuePriority)
              }
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value ?? ""}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-xs text-subtext">
          This issue will be assigned to {agentName}.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={submitting} onClick={submit}>
          {submitting ? <Spinner size={14} /> : null}
          Create
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function AgentEditForm({
  agent,
  saving,
  onSave,
}: {
  agent: { name: string; provider: string; runtime_id?: string | null; instructions?: string | null };
  saving: boolean;
  onSave: (data: {
    name: string;
    provider: string;
    runtime_id?: string | null;
    instructions?: string | null;
  }) => void;
}) {
  const [name, setName] = useState(agent.name);
  const [provider, setProvider] = useState(agent.provider);
  const [runtimeId, setRuntimeId] = useState(agent.runtime_id ?? "");
  const [instructions, setInstructions] = useState(agent.instructions ?? "");

  const save = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSave({
      name: name.trim(),
      provider,
      runtime_id: runtimeId.trim() || null,
      instructions: instructions.trim() || null,
    });
    toast.success("Saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">Provider</label>
          <Input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">
            Runtime ID
          </label>
          <Input
            value={runtimeId}
            onChange={(e) => setRuntimeId(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">
            Instructions
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            placeholder="System instructions for the agent"
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={saving} onClick={save}>
            {saving ? <Spinner size={14} /> : null}
            Save changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
