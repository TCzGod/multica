import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, initialized, init } = useAuthStore();
  const { workspaces, currentWorkspace, loadWorkspaces, loading: wsLoading } =
    useWorkspaceStore();
  const [wsLoaded, setWsLoaded] = useState(false);

  // Resolve auth state on direct entry so the CTA reflects the session.
  useEffect(() => {
    if (!initialized) void init();
  }, [initialized, init]);

  // For authenticated users, ensure workspaces are loaded so we can
  // redirect them into the app instead of leaving them on the landing page.
  useEffect(() => {
    if (!initialized || !user || wsLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadWorkspaces();
      } finally {
        if (!cancelled) setWsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [initialized, user, wsLoaded, loadWorkspaces]);

  // Once we have a current workspace, redirect into the workspace app.
  useEffect(() => {
    if (initialized && user && currentWorkspace) {
      navigate(`/${currentWorkspace.slug}/dashboard`, { replace: true });
    }
  }, [initialized, user, currentWorkspace, navigate]);

  // No workspaces after loading — send the user to create one.
  useEffect(() => {
    if (initialized && user && wsLoaded && workspaces.length === 0) {
      navigate("/new-workspace", { replace: true });
    }
  }, [initialized, user, wsLoaded, workspaces.length, navigate]);

  const authPending = !initialized || (!!user && !wsLoaded);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-25 blur-[140px]"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))" }}
          >
            R
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
            RNAIWork
          </span>
        </div>

        <nav>
          {authPending ? (
            <Spinner size="sm" />
          ) : user ? (
            <Button variant="ghost" size="sm" onClick={() => currentWorkspace && navigate(`/${currentWorkspace.slug}/dashboard`)}>
              Dashboard
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          Autonomous agents for software work
        </span>

        <h1 className="text-balance text-5xl font-semibold tracking-tight text-[var(--color-text)] sm:text-6xl">
          Put your{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))", WebkitBackgroundClip: "text" }}
          >
            issue backlog
          </span>{" "}
          on autopilot
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg text-[var(--color-text-muted)]">
          RNAIWork coordinates AI agents across your workspaces to plan, build, and ship —
          with humans in the loop every step of the way.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {authPending ? (
            <Button size="lg" disabled>
              <Spinner size="sm" /> Loading…
            </Button>
          ) : user ? (
            <Button size="lg" onClick={() => currentWorkspace && navigate(`/${currentWorkspace.slug}/dashboard`)}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate("/login")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 text-center text-xs text-[var(--color-text-subtle)]">
        © {new Date().getFullYear()} RNAIWork. All rights reserved.
      </footer>
    </div>
  );
}
