/**
 * Create-agent dialog.
 *
 * Collects the minimum fields needed to spawn an agent (name, provider,
 * runtime) plus optional instructions, then calls createAgent. On success
 * the parent's query cache is invalidated and the dialog closes.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Loader2 } from "lucide-react";
import { Button, Dialog, Input, Select, Textarea, type SelectOption } from "@/components/ui";
import { createAgent } from "@/lib/api/agents";
import { listRuntimes } from "@/lib/api/runtimes";
import { ApiError } from "@/lib/api/client";
import { PROVIDER_SLUGS, providerLabel } from "./provider-badge";

export interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
  /** Optional callback fired after a successful create. */
  onCreated?: () => void;
}

export function CreateAgentDialog({ open, onClose, onCreated }: CreateAgentDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [runtimeId, setRuntimeId] = useState("");
  const [instructions, setInstructions] = useState("");

  // Reset the form whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setName("");
      setProvider(PROVIDER_SLUGS[0] ?? "");
      setRuntimeId("");
      setInstructions("");
    }
  }, [open]);

  const { data: runtimesData } = useQuery({
    queryKey: ["runtimes"],
    queryFn: listRuntimes,
    enabled: open,
  });

  const runtimes = Array.isArray(runtimesData) ? runtimesData : [];

  const runtimeOptions: SelectOption[] = runtimes.map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const createMutation = useMutation({
    mutationFn: () =>
      createAgent({
        name: name.trim(),
        provider,
        runtime_id: runtimeId || undefined,
        instructions: instructions.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Agent created");
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
      onCreated?.();
      onClose();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to create agent";
      toast.error(message);
    },
  });

  const canSubmit = name.trim().length > 0 && provider.length > 0 && !createMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="New Agent" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="agent-name"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Issue Triage Bot"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="agent-provider"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Provider <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Select
            value={provider}
            onChange={setProvider}
            options={PROVIDER_SLUGS.map((slug) => ({
              value: slug,
              label: providerLabel(slug),
            }))}
            placeholder="Select a provider"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="agent-runtime"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Runtime
          </label>
          <Select
            value={runtimeId}
            onChange={setRuntimeId}
            options={runtimeOptions}
            placeholder="Select a runtime"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Leave unselected to assign later.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="agent-instructions"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Instructions
          </label>
          <Textarea
            id="agent-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe how this agent should behave…"
            className="min-h-[120px] font-mono text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            Create Agent
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
