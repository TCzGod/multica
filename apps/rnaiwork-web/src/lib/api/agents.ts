/**
 * Agent API functions. All routes here are workspace-scoped — fetchAPI
 * injects the X-Workspace-Slug header from the active workspace context.
 *
 * Backend routes: server/cmd/server/router.go (r.Route("/api/agents", ...))
 *
 * Agent env: the backend returns { agent_id, custom_env } on GET and PUT;
 * getAgentEnv unwraps custom_env so callers get a plain map. The sentinel
 * "****" value (envSentinel in agent_env.go) is preserved per-key on write
 * so the UI can mask secrets it doesn't want to overwrite.
 */
import { fetchAPI } from "./client";
import type { Agent, Skill, TaskRun } from "./types";

// --- Agents ----------------------------------------------------------------

/** GET /api/agents — list agents in the active workspace. */
export async function listAgents(): Promise<Agent[]> {
  return fetchAPI<Agent[]>("/api/agents");
}

/** GET /api/agents/{id} — fetch a single agent. */
export async function getAgent(id: string): Promise<Agent> {
  return fetchAPI<Agent>(`/api/agents/${id}`);
}

/** POST /api/agents — create a new agent. */
export async function createAgent(data: {
  name: string;
  provider: string;
  runtime_id?: string;
  instructions?: string;
}): Promise<Agent> {
  return fetchAPI<Agent>("/api/agents", { method: "POST", body: data });
}

/** PUT /api/agents/{id} — update agent fields. */
export async function updateAgent(
  id: string,
  data: Partial<Agent>,
): Promise<Agent> {
  return fetchAPI<Agent>(`/api/agents/${id}`, { method: "PUT", body: data });
}

/** POST /api/agents/{id}/archive — soft-delete an agent (hidden from lists,
 *  retains history). */
export async function archiveAgent(id: string): Promise<void> {
  await fetchAPI<void>(`/api/agents/${id}/archive`, { method: "POST" });
}

/** POST /api/agents/{id}/restore — un-archive a previously archived agent. */
export async function restoreAgent(id: string): Promise<void> {
  await fetchAPI<void>(`/api/agents/${id}/restore`, { method: "POST" });
}

// --- Agent tasks -----------------------------------------------------------

/** GET /api/agents/{id}/tasks — list recent task runs for an agent. */
export async function listAgentTasks(id: string): Promise<TaskRun[]> {
  return fetchAPI<TaskRun[]>(`/api/agents/${id}/tasks`);
}

// --- Agent skills ----------------------------------------------------------

/** GET /api/agents/{id}/skills — list skills attached to an agent. */
export async function listAgentSkills(id: string): Promise<Skill[]> {
  return fetchAPI<Skill[]>(`/api/agents/${id}/skills`);
}

/** PUT /api/agents/{id}/skills — replace the agent's skill set wholesale.
 *  Sends { skill_ids: [...] }; the backend validates each ID belongs to
 *  the same workspace. */
export async function setAgentSkills(
  id: string,
  skillIds: string[],
): Promise<void> {
  await fetchAPI<void>(`/api/agents/${id}/skills`, {
    method: "PUT",
    body: { skill_ids: skillIds },
  });
}

// --- Agent environment -----------------------------------------------------

interface AgentEnvResponse {
  agent_id: string;
  custom_env: Record<string, string>;
}

/** GET /api/agents/{id}/env — read the agent's custom environment variables.
 *  Returns the plaintext key→value map. The backend audits every read. */
export async function getAgentEnv(
  id: string,
): Promise<Record<string, string>> {
  const res = await fetchAPI<AgentEnvResponse>(`/api/agents/${id}/env`);
  return res.custom_env;
}

/** PUT /api/agents/{id}/env — replace the agent's env map. Send the full
 *  set of variables; the "****" sentinel preserves masked secrets from
 *  being overwritten. The backend audits every write. */
export async function updateAgentEnv(
  id: string,
  env: Record<string, string>,
): Promise<void> {
  await fetchAPI<void>(`/api/agents/${id}/env`, {
    method: "PUT",
    body: { custom_env: env },
  });
}
