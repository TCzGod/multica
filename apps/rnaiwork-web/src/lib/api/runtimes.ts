/**
 * Agent runtime API functions. All routes here are workspace-scoped —
 * fetchAPI injects the X-Workspace-Slug header from the active workspace
 * context.
 *
 * Backend routes: server/cmd/server/router.go (r.Route("/api/runtimes", ...))
 */
import { fetchAPI } from "./client";
import type { AgentRuntime } from "./types";

/** GET /api/runtimes — list agent runtimes in the active workspace. */
export async function listRuntimes(): Promise<AgentRuntime[]> {
  return fetchAPI<AgentRuntime[]>("/api/runtimes");
}
