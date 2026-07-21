/* Centralized TanStack Query keys. Invalidation by prefix keeps the
   realtime hook and mutations in sync without stringly-typed duplication. */
export const queryKeys = {
  me: ["auth", "me"] as const,
  workspaces: ["workspaces"] as const,
  members: (slug: string) => ["members", slug] as const,
  issues: (params?: Record<string, unknown>) =>
    ["issues", params ?? {}] as const,
  issue: (id: string) => ["issues", id] as const,
  issueComments: (id: string) => ["issues", id, "comments"] as const,
  issueTimeline: (id: string) => ["issues", id, "timeline"] as const,
  agents: ["agents"] as const,
  agent: (id: string) => ["agents", id] as const,
  projects: ["projects"] as const,
  chatSessions: ["chat", "sessions"] as const,
  chatMessages: (id: string) => ["chat", "sessions", id, "messages"] as const,
};

export type QueryKey = readonly unknown[];
