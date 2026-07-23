import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useT } from "@/lib/i18n/use-t";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loaded = useWorkspaceStore((s) => s.loaded);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const t = useT();

  useEffect(() => {
    if (initialized && user && !loaded) {
      void loadWorkspaces();
    }
  }, [initialized, user, loaded, loadWorkspaces]);

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (user) {
    if (!loaded) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      );
    }
    const slug = currentWorkspace?.slug;
    if (slug) return <Navigate to={`/${slug}/dashboard`} replace />;
    return <Navigate to="/new-workspace" replace />;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <Logo size="lg" />
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold text-text">
          {t("landing.title")}
        </h1>
        <p className="text-base text-subtext">
          {t("landing.description")}
        </p>
        <p className="text-sm font-medium text-text">
          {t("landing.subtitle")}
        </p>
      </div>
      <div className="flex gap-3">
        <Button size="lg" onClick={() => (window.location.href = "/login")}>
          {t("landing.signIn")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => (window.location.href = "/register")}
        >
          {t("login.register")}
        </Button>
      </div>
    </div>
  );
}
