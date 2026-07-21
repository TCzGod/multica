import { fetchAPI, apiPost, apiPut } from "./client";
import type { Agent, CreateAgentInput, UpdateAgentInput } from "./types";

export function listAgents() {
  return fetchAPI<Agent[]>("/api/agents");
}

export function getAgent(id: string) {
  return fetchAPI<Agent>(`/api/agents/${encodeURIComponent(id)}`);
}

export function createAgent(data: CreateAgentInput) {
  return apiPost<Agent>("/api/agents", data);
}

export function updateAgent(id: string, data: UpdateAgentInput) {
  return apiPut<Agent>(`/api/agents/${encodeURIComponent(id)}`, data);
}

export function archiveAgent(id: string) {
  return apiPost<{ ok?: boolean }>(
    `/api/agents/${encodeURIComponent(id)}/archive`,
  );
}

export function restoreAgent(id: string) {
  return apiPost<{ ok?: boolean }>(
    `/api/agents/${encodeURIComponent(id)}/restore`,
  );
}
