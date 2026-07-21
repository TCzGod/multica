import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { queryKeys } from "@/lib/query-keys";

/**
 * Connects to the workspace WebSocket and invalidates the relevant TanStack
 * Query caches on inbound events. Simplified: no retry/backoff, just invalidate
 * by query-key prefix so pages refetch fresh data.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const slug = currentWorkspace?.slug;
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !slug) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws?workspace_slug=${encodeURIComponent(slug)}`;

    let ws: WebSocket | null = null;
    let closedByUs = false;

    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }

    const invalidateFor = (type: string) => {
      if (type.startsWith("issue")) {
        queryClient.invalidateQueries({ queryKey: ["issues"] });
      } else if (type.startsWith("agent")) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
      } else if (type.startsWith("chat") || type.startsWith("message")) {
        queryClient.invalidateQueries({ queryKey: ["chat"] });
      } else if (type.startsWith("project")) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      } else if (type.startsWith("workspace") || type.startsWith("member")) {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        queryClient.invalidateQueries({ queryKey: ["members"] });
      } else {
        // Unknown event — refresh issues as the safest default.
        queryClient.invalidateQueries({ queryKey: ["issues"] });
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const type = String(data?.type ?? data?.event ?? "").toLowerCase();
        if (type) invalidateFor(type);
        if (data?.issue_id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.issue(String(data.issue_id)),
          });
        }
      } catch {
        /* ignore non-JSON frames */
      }
    };

    return () => {
      closedByUs = true;
      ws?.close();
      void closedByUs;
    };
  }, [userId, slug, queryClient]);
}
