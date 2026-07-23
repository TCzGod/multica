import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Bot, Plus, RotateCcw } from "lucide-react";
import {
  archiveAgent,
  createAgent,
  listAgents,
  restoreAgent,
} from "@/lib/api/agents";
import { queryKeys } from "@/lib/query-keys";
import { useT } from "@/lib/i18n/use-t";
import type { Agent } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { cn, formatRelative } from "@/lib/utils";

const PROVIDERS = ["openai", "anthropic", "custom"];

export function AgentsPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const t = useT();
  const [open, setOpen] = useState(false);

  const agentsQ = useQuery({
    queryKey: queryKeys.agents,
    queryFn: listAgents,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["agents"] });

  const createMut = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      invalidate();
      toast.success(t("agents.created"));
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("agents.createFailed")),
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

  const agents = Array.isArray(agentsQ.data) ? agentsQ.data : [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">{t("agents.title")}</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {t("agents.newAgent")}
        </Button>
      </div>

      <Card>
        {agentsQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            className="m-4 border-0 p-0"
            icon={<Bot />}
            title={t("agents.empty")}
            description={t("agents.emptyHint")}
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                {t("agents.newAgent")}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {agents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                base={`/${workspaceSlug}/agents`}
                onArchive={() => archiveMut.mutate(agent.id)}
                onRestore={() => restoreMut.mutate(agent.id)}
                busy={archiveMut.isPending || restoreMut.isPending}
              />
            ))}
          </ul>
        )}
      </Card>

      <CreateAgentDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => createMut.mutate(data)}
        submitting={createMut.isPending}
      />
    </div>
  );
}

function AgentRow({
  agent,
  base,
  onArchive,
  onRestore,
  busy,
}: {
  agent: Agent;
  base: string;
  onArchive: () => void;
  onRestore: () => void;
  busy: boolean;
}) {
  const t = useT();
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-muted text-primary">
        <Bot className="size-4" />
      </div>
      <Link
        to={`${base}/${agent.id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-text hover:underline"
      >
        {agent.name}
      </Link>
      <Badge variant="secondary">{agent.provider}</Badge>
      {agent.is_archived ? (
        <Badge variant="outline">{t("agents.archived")}</Badge>
      ) : null}
      {agent.updated_at ? (
        <span className="hidden text-xs text-subtext sm:inline">
          {formatRelative(agent.updated_at)}
        </span>
      ) : null}
      {agent.is_archived ? (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onRestore}
        >
          <RotateCcw className="size-4" />
          {t("agents.restore")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={onArchive}
        >
          <Archive className="size-4" />
          {t("agents.archive")}
        </Button>
      )}
    </li>
  );
}

function CreateAgentDialog({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    provider: string;
    runtime_id?: string | null;
    instructions?: string | null;
  }) => void;
  submitting: boolean;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [runtimeId, setRuntimeId] = useState("");
  const [instructions, setInstructions] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error(t("agents.nameRequired"));
      return;
    }
    onSubmit({
      name: name.trim(),
      provider,
      runtime_id: runtimeId.trim() || null,
      instructions: instructions.trim() || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{t("agents.newAgent")}</DialogTitle>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <Input
          placeholder={t("agents.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="space-y-1">
          <label className="text-xs font-medium text-subtext">{t("agents.provider")}</label>
          <select
            className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm text-text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder={t("agents.runtimePlaceholder")}
          value={runtimeId}
          onChange={(e) => setRuntimeId(e.target.value)}
        />
        <Textarea
          placeholder={t("agents.instructionsOptional")}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
        />
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
