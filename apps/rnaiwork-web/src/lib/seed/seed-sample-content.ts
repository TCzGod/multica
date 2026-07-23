/* ------------------------------------------------------------------
   First-time workspace seeding: create a demo project + 5 demo issues
   when (and only when) the workspace is completely empty. Idempotent —
   any pre-existing project or issue short-circuits the seeding. Errors
   are swallowed and surfaced as a non-success result so the caller can
   decide whether to retry; we never throw to avoid blocking users
   from entering the workspace.
------------------------------------------------------------------- */

import { createIssue, listIssues } from "@/lib/api/issues";
import { createProject, listProjects } from "@/lib/api/projects";
import type { Issue, Project } from "@/lib/api/types";
import { SAMPLE_ISSUES, SAMPLE_PROJECT } from "./sample-content";

export interface SeedResult {
  seeded: boolean;
  /** Present when `seeded` is false. Either a sentinel ("already_has_content")
   * or an `error: <message>` string for unexpected failures. */
  reason?: string;
}

export interface SeedOptions {
  workspaceSlug: string;
}

/**
 * Seed a workspace with sample content if (and only if) it is empty.
 *
 * Steps:
 *   1. List existing projects and issues.
 *   2. If anything exists → return `{ seeded: false, reason: "already_has_content" }`.
 *   3. Otherwise create the sample project, then fan out the 5 sample issues
 *      in parallel, each tagged with the new project's id.
 *   4. Return `{ seeded: true }` on success.
 *
 * Any thrown error is caught and returned as `{ seeded: false, reason: "error: ..." }`.
 */
export async function seedSampleContentIfNeeded(
  opts: SeedOptions,
): Promise<SeedResult> {
  try {
    // Defensive: caller usually guards this, but we cannot rely on it.
    if (!opts?.workspaceSlug) {
      return { seeded: false, reason: "error: missing workspaceSlug" };
    }

    const [projects, issues] = await Promise.all([
      listProjects().then((list) => (Array.isArray(list) ? list : [])),
      listIssues().then((list) => (Array.isArray(list) ? list : [])),
    ]);

    if (projects.length > 0 || issues.length > 0) {
      return { seeded: false, reason: "already_has_content" };
    }

    // Create the demo project first so we can attach issues to it.
    const project: Project = await createProject(SAMPLE_PROJECT);

    // Fan out the 5 sample issues in parallel. Each gets the new project id.
    // We use `Promise.allSettled` semantics implicitly via try/catch below —
    // if any one fails we still report a non-success without throwing.
    const issuePromises = SAMPLE_ISSUES.map((issue) =>
      createIssue({
        ...issue,
        project_id: project.id,
      }),
    );

    const results = await Promise.allSettled(issuePromises);

    // If every issue failed, treat as an error — but still don't throw.
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failures.length === results.length && results.length > 0) {
      const first = failures[0];
      const msg =
        first.reason instanceof Error
          ? first.reason.message
          : String(first.reason ?? "unknown error");
      return { seeded: false, reason: `error: ${msg}` };
    }

    // Even partial success counts as seeded — the workspace is no longer empty.
    // Cast: ignore unused Issue[] binding (kept for clarity / future telemetry).
    const _created: Issue[] = results
      .filter(
        (r): r is PromiseFulfilledResult<Issue> => r.status === "fulfilled",
      )
      .map((r) => r.value);
    void _created;

    return { seeded: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { seeded: false, reason: `error: ${msg}` };
  }
}
