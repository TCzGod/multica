/**
 * Runtimes list page.
 *
 * Renders the workspace's agent runtimes as a table. Each row shows the
 * runtime name, an online/offline status badge, hostname, the CLIs it
 * advertises (as badges), and a relative "last seen" time. A per-row
 * dropdown exposes a delete action. Data is fetched via listRuntimes()
 * and cache invalidation is shared with the rest of the app under the
 * ["runtimes"] query key.
 *
 * Rendered at /:workspaceSlug/runtimes (see src/router/index.tsx).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreVertical, ServerCog, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  EmptyState,
  Spinner,
} from "@/components/ui";
import { listRuntimes } from "@/lib/api/runtimes";
import { fetchAPI } from "@/lib/api/client";
import type { AgentRuntime } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils";

export default function RuntimesPage() {
  const queryClient = useQueryClient();

  const runtimesQuery = useQuery({
    queryKey: ["runtimes"],
    queryFn: listRuntimes,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchAPI<void>(`/api/runtimes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runtimes"] });
      toast.success("Runtime deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete runtime");
    },
  });

  function handleDelete(runtime: AgentRuntime) {
    if (
      !window.confirm(
        `Delete runtime "${runtime.name}"? Agents bound to it will need to be reassigned.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(runtime.id);
  }

  const runtimes = runtimesQuery.data ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Runtimes
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Agent execution environments registered in this workspace
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto">
        {runtimesQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : runtimesQuery.isError ? (
          <EmptyState
            className="py-20"
            icon={<ServerCog className="h-8 w-8" />}
            title="Couldn't load runtimes"
            description={
              runtimesQuery.error instanceof Error
                ? runtimesQuery.error.message
                : "Something went wrong. Please try again."
            }
            action={
              <Button variant="outline" onClick={() => runtimesQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : runtimes.length === 0 ? (
          <EmptyState
            className="py-20"
            icon={<ServerCog className="h-10 w-10" />}
            title="No runtimes registered"
            description="Runtimes appear here once an agent daemon connects and registers with this workspace."
          />
        ) : (
          <RuntimeTable
            runtimes={runtimes}
            onDelete={handleDelete}
            deleting={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

// --- Table ------------------------------------------------------------------

const COLUMNS = ["Name", "Status", "Hostname", "CLIs", "Last seen", ""];

function RuntimeTable({
  runtimes,
  onDelete,
  deleting,
}: {
  runtimes: AgentRuntime[];
  onDelete: (runtime: AgentRuntime) => void;
  deleting: boolean;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-subtle)]">
          <th className="px-6 py-2 font-medium">{COLUMNS[0]}</th>
          <th className="px-3 py-2 font-medium" style={{ width: "8rem" }}>
            {COLUMNS[1]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "14rem" }}>
            {COLUMNS[2]}
          </th>
          <th className="px-3 py-2 font-medium">{COLUMNS[3]}</th>
          <th className="px-3 py-2 font-medium" style={{ width: "10rem" }}>
            {COLUMNS[4]}
          </th>
          <th className="px-6 py-2 font-medium" style={{ width: "3rem" }}>
            {COLUMNS[5]}
          </th>
        </tr>
      </thead>
      <tbody>
        {runtimes.map((runtime) => (
          <RuntimeRow
            key={runtime.id}
            runtime={runtime}
            onDelete={() => onDelete(runtime)}
            deleting={deleting}
          />
        ))}
      </tbody>
    </table>
  );
}

function RuntimeRow({
  runtime,
  onDelete,
  deleting,
}: {
  runtime: AgentRuntime;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <tr className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]">
      <td className="px-6 py-3">
        <span className="font-medium text-[var(--color-text)]">{runtime.name}</span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge isOnline={runtime.is_online} status={runtime.status} />
      </td>
      <td className="px-3 py-3">
        {runtime.hostname ? (
          <span className="font-mono text-xs text-[var(--color-text-muted)]">
            {runtime.hostname}
          </span>
        ) : (
          <span className="text-[var(--color-text-subtle)]">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {runtime.available_clis && runtime.available_clis.length > 0 ? (
            runtime.available_clis.map((cli) => (
              <Badge key={cli} variant="outline" className="font-mono">
                {cli}
              </Badge>
            ))
          ) : (
            <span className="text-[var(--color-text-subtle)]">—</span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-[var(--color-text-muted)]">
        {runtime.last_seen_at ? (
          formatRelativeTime(runtime.last_seen_at)
        ) : (
          <span className="text-[var(--color-text-subtle)]">Never</span>
        )}
      </td>
      <td className="px-6 py-3 text-right">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              aria-label="Runtime actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        >
          <DropdownMenuItem
            className="text-[var(--color-danger)]"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete runtime"}
          </DropdownMenuItem>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function StatusBadge({
  isOnline,
  status,
}: {
  isOnline: boolean;
  status: string;
}) {
  // is_online is the authoritative liveness signal; status carries the
  // raw runtime-reported state (e.g. "available", "busy", "offline").
  return (
    <Badge variant={isOnline ? "success" : "outline"} className="capitalize">
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: isOnline
            ? "var(--color-success)"
            : "var(--color-text-subtle)",
        }}
      />
      {isOnline ? "Online" : status || "Offline"}
    </Badge>
  );
}
