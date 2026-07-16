/**
 * Realtime WebSocket client for the RNAIWork web frontend.
 *
 * Protocol (see the server /ws handler):
 *  1. Client opens a connection to /ws. The browser sends the
 *     `multica_logged_in` cookie automatically (cookie-based auth — see
 *     lib/api/client.ts), so no token is read in JS.
 *  2. Client sends the first message: {"type": "auth"}.
 *  3. Server replies with {"type": "auth_ack"}.
 *  4. Server pushes events: {"type": "issue_updated", "data": {...}},
 *     {"type": "issue_created", ...}, {"type": "comment_created", ...},
 *     {"type": "agent_status_changed", ...}, etc.
 *
 * The module exports a singleton `realtime` client with a tiny pub/sub API:
 *  - connect() / disconnect() manage the socket lifecycle, including
 *    exponential-backoff reconnection (capped at maxReconnectAttempts).
 *  - on(type, handler) subscribes to an event type and returns an
 *    unsubscribe function; off(type, handler) removes it.
 *
 * connect() is idempotent: calling it while already connected (or still
 * connecting) is a no-op, so multiple hooks can call it without spawning
 * duplicate sockets. disconnect() cancels any pending reconnect.
 */

type WSMessage = {
  type: string;
  data?: any;
  [key: string]: any;
};

type EventHandler = (data: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Open the WebSocket. Idempotent — safe to call from multiple hooks. */
  connect() {
    // Already connected (or still connecting) — nothing to do.
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.shouldReconnect = true;

    // Same-origin: in dev the Vite proxy forwards /ws to the backend
    // (see vite.config.ts), in prod the ingress terminates /ws.
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.reconnectAttempts = 0;
      // Cookie-based auth — the browser carries multica_logged_in, so we
      // only need to signal readiness to the server.
      this.send({ type: "auth" });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.emit(msg.type, msg.data ?? msg);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] Disconnected");
      this.ws = null;
      this.reconnectTimer = null;
      if (
        this.shouldReconnect &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.reconnectAttempts++;
        const delay =
          this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`[WS] Reconnecting in ${delay}ms`);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };
  }

  /** Close the WebSocket and stop reconnecting. */
  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** Send a message to the server. No-op if the socket isn't open. */
  send(msg: WSMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Subscribe to an event type. Returns an unsubscribe function. */
  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  /** Unsubscribe a handler from an event type. */
  off(type: string, handler: EventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  private emit(type: string, data: any) {
    this.handlers.get(type)?.forEach((h) => h(data));
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const realtime = new RealtimeClient();
