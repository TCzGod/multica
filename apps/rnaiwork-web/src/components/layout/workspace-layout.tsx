import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { setWorkspaceContext } from "@/lib/api/client";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/** Full-screen loader used while auth/workspaces are being resolved. */
function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Workspace shell layout.
 *
 * Responsibilities:
 * - Auth guard: once the session probe (`init`) has settled, bounce
 *   unauthenticated users to /login.
 * - Load the user's workspaces once after login.
 * - Resolve the active workspace from the `:workspaceSlug` URL param and
 *   sync it to the API client via setWorkspaceContext() so workspace-scoped
 *   requests carry the correct X-Workspace-Slug header. The workspace store
 *   also sets this internally, but we set it here too so an unknown slug
 *   still produces a correct header (→ backend 403) instead of leaking the
 *   previous workspace's context.
 * - Render the sidebar + topbar chrome around the routed page (Outlet),
 *   wrapped in Suspense for the lazy-loaded workspace pages.
 */
export function WorkspaceLayout() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  const user = useAuthStore((s) => s.user);
  const authInitialized = useAuthStore((s) => s.initialized);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsError = useWorkspaceStore((s) => s.error);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  // The workspace store has no "hasLoaded" flag, so we track the first
  // load attempt locally to distinguish "not loaded yet" from "loaded with
  // zero workspaces".
  const [wsLoaded, setWsLoaded] = useState(false);

  // Load workspaces once the session is known to be valid.
  useEffect(() => {
    if (!authInitialized || !user || wsLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadWorkspaces();
      } finally {
        if (!cancelled) setWsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authInitialized, user, wsLoaded, loadWorkspaces]);

  // Resolve the URL slug → workspace object and sync the API client header.
  // Re-runs when `workspaces` populates so the match succeeds after the
  // initial load. The store's setCurrentWorkspace also persists the last
  // workspace to localStorage.
  useEffect(() => {
    if (!workspaceSlug) return;
    const ws = workspaces.find((w) => w.slug === workspaceSlug) ?? null;
    if (ws && ws.id !== currentWorkspace?.id) {
      setCurrentWorkspace(ws);
    }
  }, [workspaceSlug, workspaces, currentWorkspace?.id, setCurrentWorkspace]);

  // Set workspace context SYNCHRONOUSLY during render (not in useEffect)
  // so child components' useQuery calls have the X-Workspace-Slug header
  // on their very first request. React runs child effects before parent
  // effects, so a useEffect-only approach causes a race where the first
  // batch of API calls goes out without the workspace header.
  if (workspaceSlug) {
    const ws = workspaces.find((w) => w.slug === workspaceSlug) ?? null;
    setWorkspaceContext({ slug: workspaceSlug, id: ws?.id ?? null });
  }

  // Realtime sync — keep TanStack Query caches fresh as the backend pushes
  // updates over /ws. The hook connects once authenticated (it guards on
  // `user` internally) and disconnects on unmount/logout. Must be called
  // unconditionally, so it lives here with the other hooks before any
  // early return.
  useRealtimeSync();

  // Auth guard — only act once the probe has settled.
  if (authInitialized && !user) {
    return <Navigate to="/login" replace />;
  }

  // Still probing auth, or fetching workspaces for the first time.
  if (!authInitialized || (user && !wsLoaded)) {
    return <FullScreenLoader />;
  }

  // Workspaces failed to load — surface a retry rather than a blank shell.
  if (wsError && workspaces.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)] text-center">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Couldn&apos;t load workspaces
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{wsError}</p>
          <button
            type="button"
            onClick={() => {
              setWsLoaded(false);
              void loadWorkspaces();
            }}
            className="mt-4 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loaded but the slug doesn't match any membership. Context was still set
  // above so the backend can return a proper 403 if a request goes out.
  if (workspaceSlug && !currentWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)] text-center">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Workspace not found
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            You don&apos;t have access to &ldquo;{workspaceSlug}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)]">
      {workspaceSlug && <Sidebar workspaceSlug={workspaceSlug} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<FullScreenLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
