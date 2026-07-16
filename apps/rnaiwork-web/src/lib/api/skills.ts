/**
 * Skill API functions. All routes here are workspace-scoped — fetchAPI
 * injects the X-Workspace-Slug header from the active workspace context.
 *
 * Backend routes: server/cmd/server/router.go (r.Route("/api/skills", ...))
 */
import { fetchAPI } from "./client";
import type { Skill } from "./types";

/** GET /api/skills — list skills in the active workspace. */
export async function listSkills(): Promise<Skill[]> {
  return fetchAPI<Skill[]>("/api/skills");
}
