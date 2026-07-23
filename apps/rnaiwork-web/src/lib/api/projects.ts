import { fetchAPI, apiPost } from "./client";
import type { CreateProjectInput, Project } from "./types";

export async function listProjects(): Promise<Project[]> {
  const res = await fetchAPI<{ projects: Project[]; total: number }>("/api/projects");
  return res?.projects ?? [];
}

export function createProject(data: CreateProjectInput) {
  return apiPost<Project>("/api/projects", data);
}
