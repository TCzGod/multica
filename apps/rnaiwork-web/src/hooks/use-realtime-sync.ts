import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { queryKeys } from "@/lib/query-keys";

/**
 * Connects to the workspace WebSocket and invalidates the relevant TanStack
 * Query caches on inbound events.
 *
 * Implementation notes:
 *  - The WebSocket is stored in a ref so React StrictMode's double-mount /
 *    re-renders don't tear down an established connection.
 *  - Reconnect with exponential backoff (capped at 30s) so transient drops
 *    self-heal without page reload.
 *  - The cleanup function only closes the socket when the dependency tuple
 *    (userId, slug) actually changes — i.e. workspace switch or logout —
 *    not on every render pass.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const slug = currentWorkspace?.slug;
  const userId = user?.id;

  // Refs keep mutable state across renders without retriggering the effect.
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(1000);
  // Marks whether the disconnect was user-initiated (unmount/switch). When
  // true, the reconnect loop is suppressed.
  const closedByUsRef = useRef(false);
  // Refs to the latest values so the reconnect closure sees fresh data
  // without being re-created (which would reset backoff).
  const userIdRef = useRef(userId);
  const slugRef = useRef(slug);
  userIdRef.current = userId;
  slugRef.current = slug;

  useEffect(() => {
    if (!userId || !slug) {
      // Nothing to connect to — make sure any leftover socket is closed.
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        closedByUsRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
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
        queryClient.invalidateQueries({ queryKey: ["issues"] });
      }
    };

    const connect = () => {
      const currentUserId = userIdRef.current;
      const currentSlug = slugRef.current;
      if (!currentUserId || !currentSlug) return;

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${window.location.host}/ws?workspace_slug=${encodeURIComponent(currentSlug)}`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;
      closedByUsRef.current = false;

      ws.onopen = () => {
        // Reset backoff on successful connect.
        backoffRef.current = 1000;
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

      ws.onclose = () => {
        if (closedByUsRef.current) return;
        scheduleReconnect();
      };

      ws.onerror = () => {
        // The browser will fire onclose after onerror; reconnect there.
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
    };

    const scheduleReconnect = () => {
      if (closedByUsRef.current) return;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      // Exponential backoff capped at 30s.
      const delay = Math.min(backoffRef.current, 30000);
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      closedByUsRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          /* ignore */
        }
        wsRef.current = null;
      }
      // Reset backoff so the next mount starts fresh.
      backoffRef.current = 1000;
    };
    // queryClient is stable (from useQueryClient), so we intentionally don't
    // include it — including it would re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, slug]);
}
