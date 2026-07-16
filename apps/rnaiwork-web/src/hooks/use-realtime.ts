import { useEffect, useRef } from "react";
import { realtime } from "@/lib/realtime/websocket";
import { useAuthStore } from "@/stores/auth";

/**
 * Open the realtime WebSocket while a user is signed in, and tear it down
 * on unmount / logout. Returns the singleton client for direct access.
 *
 * Safe to mount alongside useRealtimeSync — RealtimeClient.connect() is
 * idempotent. The connection itself is not workspace-scoped; it carries
 * events for the authenticated user across workspaces.
 */
export function useRealtime() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    realtime.connect();
    return () => {
      realtime.disconnect();
    };
  }, [user]);

  return realtime;
}

/**
 * Subscribe to a realtime event type for the lifetime of the component.
 *
 * The latest `handler` is always invoked (via a ref) so callers can pass
 * inline closures without forcing a resubscribe on every render — the
 * subscription itself only re-registers when `type` changes.
 */
export function useRealtimeEvent(type: string, handler: (data: any) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsub = realtime.on(type, (data) => handlerRef.current(data));
    return unsub;
  }, [type]);
}
