import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { setWorkspaceContext } from "@/lib/api/client";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { WorkspaceChrome } from "@/components/layout/workspace-layout";
import { Spinner } from "@/components/ui/spinner";

/**
 * Route-level layout: auth guard, workspace context sync, realtime hook,
 * and lazy-chrome rendering. `setWorkspaceContext` is called synchronously
 * in the render body so child useQuery calls see the right X-Workspace-Slug
 * header immediately (no effect-timing race).
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
