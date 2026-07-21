import { fetchAPI } from "./client";
import type { AgentActivity, AgentRunCounts } from "./types";

export async function getAgentActivity30d(): Promise<AgentActivity[]> {
  return fetchAPI<AgentActivity[]>("/api/agent-activity-30d");
}

export async function getAgentRunCounts(): Promise<AgentRunCounts> {
  return fetchAPI<AgentRunCounts>("/api/agent-run-counts");
}

export async function getDashboardData(): Promise<any> {
  return fetchAPI("/api/dashboard");
}