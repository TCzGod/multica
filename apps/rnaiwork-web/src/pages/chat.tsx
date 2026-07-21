import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Send, MessageSquare } from "lucide-react";
import {
  createChatSession,
  listChatMessages,
  listChatSessions,
  sendChatMessage,
} from "@/lib/api/chat";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelative } from "@/lib/utils";

export function ChatPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const sessionsQ = useQuery({
    queryKey: queryKeys.chatSessions,
    queryFn: listChatSessions,
  });

  const sessions = Array.isArray(sessionsQ.data) ? sessionsQ.data : [];

  useEffect(() => {
    if (!activeId && sessions.length > 0) setActiveId(sessions[0].id);
  }, [activeId, sessions]);

  const messagesQ = useQuery({
    queryKey: activeId ? queryKeys.chatMessages(activeId) : ["chat", "none"],
    queryFn: () => listChatMessages(activeId!),
    enabled: !!activeId,
  });

  const createSessionMut = useMutation({
    mutationFn: createChatSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
      setActiveId(session.id);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to create session"),
  });

  const sendMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      sendChatMessage(id, content),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(vars.id),
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to send"),
  });

  const messages = Array.isArray(messagesQ.data) ? messagesQ.data : [];

  const onSend = () => {
    if (!activeId || !draft.trim()) return;
    sendMut.mutate({ id: activeId, content: draft.trim() });
    setDraft("");
  };

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-semibold text-text">Chats</span>
          <Button
            size="sm"
            variant="outline"
            disabled={createSessionMut.isPending}
            onClick={() => createSessionMut.mutate({})}
          >
            <Plus className="size-4" />
            New
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {sessionsQ.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-subtext">No sessions.</p>
          ) : (
            <ul>
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      "w-full truncate px-3 py-2 text-left text-sm hover:bg-muted",
                      s.id === activeId
                        ? "bg-primary-muted font-medium text-primary"
                        : "text-text",
                    )}
                  >
                    {s.title || "Untitled chat"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col overflow-hidden">
        {activeId ? (
          <>
            <div className="flex-1 overflow-auto p-4">
              {messagesQ.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  className="border-0"
                  icon={<MessageSquare />}
                  title="Start the conversation"
                  description="Send a message to begin chatting."
                />
              ) : (
                <ul className="space-y-3">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-fg"
                            : "bg-muted text-text",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            m.role === "user"
                              ? "text-primary-fg/70"
                              : "text-subtext",
                          )}
                        >
                          {formatRelative(m.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input
                placeholder="Message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                className="flex-1"
              />
              <Button
                disabled={sendMut.isPending || !draft.trim()}
                onClick={onSend}
              >
                {sendMut.isPending ? <Spinner size={14} /> : <Send className="size-4" />}
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<MessageSquare />}
              title="No chat selected"
              description="Create a session to start a conversation."
              action={
                <Button
                  size="sm"
                  disabled={createSessionMut.isPending}
                  onClick={() => createSessionMut.mutate({})}
                >
                  <Plus className="size-4" />
                  New chat
                </Button>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
