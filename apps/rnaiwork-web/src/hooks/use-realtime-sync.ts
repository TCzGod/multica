import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtime } from "@/lib/realtime/websocket";
import { useAuthStore } from "@/stores/auth";

/**
 * Keep TanStack Query caches in sync with realtime WebSocket events.
 *
 * Mount this once inside the workspace shell (see WorkspaceLayout) so it
 * is active whenever a signed-in user is in a workspace. It opens the
 * realtime connection on mount (idempotent) and invalidates the relevant
 * query caches as events arrive, so lists/details refresh without a
 * manual refetch.
 *
 * Invalidation targets the actual query keys used across the app:
 *  - issues list:   ["issues", filters]       → invalidate ["issues"]
 *  - issue detail:  ["issue", issueId]
 *  - comments:      ["issue", issueId, "comments"]
 *  - timeline:      ["issue", issueId, "timeline"]
 *  - agents list:   ["agents"]
 *  - agent tasks:   ["agent-tasks", agentId]  → invalidate ["agent-tasks"]
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    realtime.connect();

    // Issues list — refresh on any issue lifecycle event.
    const unsubIssueCreated = realtime.on("issue_created", () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    });
    const unsubIssueUpdated = realtime.on("issue_updated", (data: any) => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
      if (data?.id) {
        // Refresh the detail view if one is mounted for this issue.
        void queryClient.invalidateQueries({ queryKey: ["issue", data.id] });
      }
    });

    // Comments — refresh the affected issue's comments + timeline. The
    // keys are issue-scoped; fall back to invalidating all issue detail
    // queries if the event doesn't carry an issue_id.
    const unsubCommentCreated = realtime.on("comment_created", (data: any) => {
      const issueId = data?.issue_id;
      if (issueId) {
        void queryClient.invalidateQueries({
          queryKey: ["issue", issueId, "comments"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["issue", issueId, "timeline"],
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["issue"] });
      }
    });

    // Agents — refresh the list on status changes.
    const unsubAgentUpdated = realtime.on("agent_status_changed", () => {
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    });

    // Tasks — agent task queries are keyed ["agent-tasks", agentId].
    const unsubTaskUpdated = realtime.on("task_updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
    });

    return () => {
      unsubIssueCreated();
      unsubIssueUpdated();
      unsubCommentCreated();
      unsubAgentUpdated();
      unsubTaskUpdated();
      realtime.disconnect();
    };
  }, [user, queryClient]);
}
