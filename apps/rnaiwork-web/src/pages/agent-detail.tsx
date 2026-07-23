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
import { useT } from "@/lib/i18n/use-t";
import type { TranslationKey } from "@/lib/i18n/translations";
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

const STATUS_LABEL_KEYS: Record<IssueStatus, TranslationKey> = {
  backlog: "status.backlog",
  todo: "status.todo",
  in_progress: "status.in_progress",
  in_review: "status.in_review",
  done: "status.done",
  cancelled: "status.cancelled",
};

const PRIORITY_LABEL_KEYS: Record<string, TranslationKey> = {
  urgent: "priority.urgent",
  high: "priority.high",
  medium: "priority.medium",
  low: "priority.low",
};

export function AgentDetailPage() {
  const { agentId, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

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
      toast.error(err instanceof Error ? err.message : t("agents.updateFailed")),
  });
  const archiveMut = useMutation({
    mutationFn: archiveAgent,
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("agents.archiveFailed")),
  });
  const restoreMut = useMutation({
    mutationFn: restoreAgent,
    onSuccess: invalidate,
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("agents.restoreFailed")),
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
      toast.success(t("issues.created"));
      setCreateOpen(false);
      navigate(`/${workspaceSlug}/issues/${issue.id}`);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t("issues.createFailed"),
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
          title={t("agents.notFoundTitle")}
          description={t("agents.notFoundHint")}
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
        {t("agents.backToAgents")}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text">{agent.name}</h1>
          <Badge variant="secondary">{agent.provider}</Badge>
          {agent.is_archived ? (
            <Badge variant="outline">{t("agents.archived")}</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={agent.is_archived || createIssueMut.isPending}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            {t("agents.createIssue")}
          </Button>
          {agent.is_archived ? (
            <Button
              variant="outline"
              disabled={restoreMut.isPending}
              onClick={() => restoreMut.mutate(agent.id)}
            >
              <RotateCcw className="size-4" />
              {t("agents.restore")}
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={archiveMut.isPending}
              onClick={() => archiveMut.mutate(agent.id)}
            >
              <Archive className="size-4" />
              {t("agents.archive")}
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
  const t = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>("backlog");
  const [priority, setPriority] = useState<IssuePriority>("medium");

  const submit = () => {
    if (!title.trim()) {
      toast.error(t("issues.titleRequired"));
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
        <DialogTitle>{t("agents.createIssueFor", { name: agentName })}</DialogTitle>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <Input
          placeholder={t("issues.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          placeholder={t("agents.taskHint")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">{t("issues.status")}</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(STATUS_LABEL_KEYS[o.value])}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">{t("issues.priority")}</label>
            <Select
              value={priority ?? ""}
              onChange={(e) =>
                setPriority((e.target.value || null) as IssuePriority)
              }
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value ?? ""}>
                  {o.value === null
                    ? t("priority.none")
                    : t(PRIORITY_LABEL_KEYS[o.value] ?? ("priority.none" as TranslationKey))}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-xs text-subtext">
          {t("agents.issueAssignedHint", { name: agentName })}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button disabled={submitting} onClick={submit}>
          {submitting ? <Spinner size={14} /> : null}
          {t("common.create")}
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
  const t = useT();
  const [name, setName] = useState(agent.name);
  const [provider, setProvider] = useState(agent.provider);
  const [runtimeId, setRuntimeId] = useState(agent.runtime_id ?? "");
  const [instructions, setInstructions] = useState(agent.instructions ?? "");

  const save = () => {
    if (!name.trim()) {
      toast.error(t("agents.nameRequired"));
      return;
    }
    onSave({
      name: name.trim(),
      provider,
      runtime_id: runtimeId.trim() || null,
      instructions: instructions.trim() || null,
    });
    toast.success(t("agents.saved"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("agents.configuration")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">{t("agents.name")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">{t("agents.provider")}</label>
          <Input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">
            {t("agents.runtimeId")}
          </label>
          <Input
            value={runtimeId}
            onChange={(e) => setRuntimeId(e.target.value)}
            placeholder={t("agents.runtimeOptional")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">
            {t("agents.instructions")}
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            placeholder={t("agents.instructionsPlaceholder")}
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={saving} onClick={save}>
            {saving ? <Spinner size={14} /> : null}
            {t("agents.saveChanges")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
