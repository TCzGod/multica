import { fetchAPI, apiPost } from "./client";
import type { CreateProjectInput, Project } from "./types";

export function listProjects() {
  return fetchAPI<Project[]>("/api/projects");
}

export function createProject(data: CreateProjectInput) {
  return apiPost<Project>("/api/projects", data);
}
