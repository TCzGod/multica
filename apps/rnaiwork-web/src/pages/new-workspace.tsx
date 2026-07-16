import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { createWorkspace } from "@/lib/api/workspaces";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

/** Convert a display name into a URL-safe slug. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function NewWorkspacePage() {
  const navigate = useNavigate();
  const { user, initialized, init } = useAuthStore();
  const { loadWorkspaces } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!initialized) void init();
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && !user) navigate("/login", { replace: true });
  }, [initialized, user, navigate]);

  // Auto-generate slug from name unless the user manually edited it.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  const handleSlugChange = (value: string) => {
    setSlugEdited(true);
    setSlug(slugify(value));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) return;
    if (!trimmedSlug) {
      toast.error("Please enter a workspace URL.");
      return;
    }
    setCreating(true);
    try {
      const ws = await createWorkspace({
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim() || undefined,
      });
      await loadWorkspaces();
      toast.success(`Workspace "${trimmedName}" created.`);
      navigate(`/${ws.slug}/dashboard`, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.body && typeof err.body === "object" && "error" in err.body
            ? String((err.body as Record<string, unknown>).error)
            : err.message
          : err instanceof Error
            ? err.message
            : "Failed to create workspace.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))" }}
            >
              R
            </span>
            <span className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              RNAIWork
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            Create your workspace
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            A workspace is where your team and agents collaborate on issues.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-medium text-[var(--color-text-muted)]"
              >
                Workspace name
              </label>
              <Input
                id="name"
                type="text"
                autoFocus
                placeholder="My Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="slug"
                className="text-xs font-medium text-[var(--color-text-muted)]"
              >
                Workspace URL
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[var(--color-text-subtle)]">
                  localhost:3000/
                </span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="my-team"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={creating}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="text-xs font-medium text-[var(--color-text-muted)]"
              >
                Description <span className="text-[var(--color-text-subtle)]">(optional)</span>
              </label>
              <Textarea
                id="description"
                rows={2}
                placeholder="What is this workspace for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={creating}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Spinner size="sm" /> Creating…
                </>
              ) : (
                "Create workspace"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
