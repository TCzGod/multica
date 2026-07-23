import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { setWorkspaceContext } from "@/lib/api/client";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { WorkspaceChrome } from "@/components/layout/workspace-layout";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/lib/i18n/use-t";
import { seedSampleContentIfNeeded } from "@/lib/seed/seed-sample-content";

/** localStorage key prefix used to remember that we have already seeded a
 *  given workspace, so we don't re-seed on every subsequent visit. */
const SEEDED_KEY_PREFIX = "rnaiwork_seeded_";

/**
 * Route-level layout: auth guard, workspace context sync, realtime hook,
 * and lazy-chrome rendering. `setWorkspaceContext` is called synchronously
 * in the render body so child useQuery calls see the right X-Workspace-Slug
 * header immediately (no effect-timing race).
 *
 * On first entry into an empty workspace this layout also seeds a sample
 * project + 5 sample issues, then invalidates the issues/projects query
 * caches so the freshly created content shows up immediately.
 */
export function WorkspaceLayout() {
  const { workspaceSlug } = useParams();
  const authInitialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const loaded = useWorkspaceStore((s) => s.loaded);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  const t = useT();
  const queryClient = useQueryClient();

  // Track whether seeding has been attempted in this component instance.
  // `useRef` survives React StrictMode's double-render so we never fire the
  // POST chain twice for the same mount.
  const seedingRef = useRef(false);
  const [seedingState, setSeedingState] = useState<
    "idle" | "seeding" | "done" | "error"
  >("idle");

  // Load the user's workspaces once auth is ready and not yet loaded.
  useEffect(() => {
    if (authInitialized && user && !loaded) {
      void loadWorkspaces();
    }
  }, [authInitialized, user, loaded, loadWorkspaces]);

  const matched = Array.isArray(workspaces)
    ? (workspaces.find((w) => w.slug === workspaceSlug) ?? null)
    : null;

  // Synchronous context mutation — safe (module-level, not React state).
  if (workspaceSlug) {
    setWorkspaceContext({
      slug: workspaceSlug,
      id: matched?.id ?? currentWorkspace?.id ?? null,
    });
  }

  // Sync the store's current workspace for display/persistence (effect).
  useEffect(() => {
    if (!workspaceSlug) return;
    if (matched && currentWorkspace?.slug !== workspaceSlug) {
      setCurrentWorkspace(matched);
    }
  }, [workspaceSlug, matched, currentWorkspace?.slug, setCurrentWorkspace]);

  // Seed sample content on first entry to an empty workspace. Skipped when:
  //   - SSR / hydration (no window)
  //   - already attempted in this mount (StrictMode guard via useRef)
  //   - localStorage already marks this workspace as seeded
  //   - workspaces are still loading or the slug doesn't match a known ws
  // Failures are swallowed — we must not block the user from entering.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!workspaceSlug || !matched || !user) return;
    if (seedingRef.current) return;
    if (seedingState !== "idle") return;

    // Cross-session guard: if we already seeded this workspace, skip.
    try {
      if (localStorage.getItem(SEEDED_KEY_PREFIX + workspaceSlug)) {
        setSeedingState("done");
        return;
      }
    } catch {
      /* localStorage unavailable — fall through and attempt seeding */
    }

    seedingRef.current = true;
    setSeedingState("seeding");

    void (async () => {
      const result = await seedSampleContentIfNeeded({
        workspaceSlug,
      });
      if (result.seeded) {
        // Persist the seeded marker so we never re-seed this workspace.
        try {
          localStorage.setItem(SEEDED_KEY_PREFIX + workspaceSlug, "1");
        } catch {
          /* ignore quota / privacy mode errors */
        }
        // Invalidate query caches so pages refetch with the new content.
        queryClient.invalidateQueries({ queryKey: ["issues"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        try {
          toast.success(t("seed.welcome"), {
            description: t("seed.welcomeDesc"),
          });
        } catch {
          /* toast failures are non-fatal */
        }
        setSeedingState("done");
      } else if (result.reason === "already_has_content") {
        // Workspace already had content — treat as seeded to avoid retries.
        try {
          localStorage.setItem(SEEDED_KEY_PREFIX + workspaceSlug, "1");
        } catch {
          /* ignore */
        }
        setSeedingState("done");
      } else {
        // Unexpected error — silently mark as done so we don't loop.
        // (We could also surface a toast, but the spec asks us to stay quiet.)
        setSeedingState("error");
      }
    })();
  }, [
    workspaceSlug,
    matched,
    user,
    seedingState,
    queryClient,
    t,
  ]);

  useRealtimeSync();

  if (!authInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Still loading workspaces.
  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // No workspaces at all → create one.
  if (workspaces.length === 0) {
    return <Navigate to="/new-workspace" replace />;
  }

  // Route slug not among the user's workspaces → bounce to the first one.
  if (workspaceSlug && !matched) {
    return <Navigate to={`/${workspaces[0].slug}/dashboard`} replace />;
  }

  return <WorkspaceChrome />;
}
