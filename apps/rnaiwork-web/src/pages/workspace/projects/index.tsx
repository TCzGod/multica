/**
 * Projects list page.
 *
 * Renders the workspace's projects as a card grid. Each card shows the
 * project's color dot, name, description, and issue count, plus a dropdown
 * menu with a delete action. "New Project" opens a dialog collecting name,
 * description, and a color. All data flows through TanStack Query backed by
 * fetchAPI directly — there is no dedicated projects API module yet.
 *
 * Rendered at /:workspaceSlug/projects (see src/router/index.tsx).
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderKanban, MoreVertical, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuItem,
  EmptyState,
  Input,
  Spinner,
  Textarea,
} from "@/components/ui";
import { fetchAPI } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

/** Preset palette for the color picker. The hex values are written straight
 *  to the project's `color` column and rendered as the card's dot. */
const PRESET_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#8b5cf6", // violet
  "#64748b", // slate
];

const DEFAULT_COLOR = PRESET_COLORS[0];

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchAPI<Project[]>("/api/projects"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchAPI<void>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    },
  });

  function handleDelete(project: Project) {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(project.id);
  }

  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Projects
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Group and organize issues across your workspace
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {projectsQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : projectsQuery.isError ? (
          <EmptyState
            icon={<FolderKanban className="h-8 w-8" />}
            title="Couldn't load projects"
            description={
              projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : "Something went wrong. Please try again."
            }
            action={
              <Button variant="outline" onClick={() => projectsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : projects.length === 0 ? (
          <EmptyState
            className="py-20"
            icon={<FolderKanban className="h-10 w-10" />}
            title="No projects yet"
            description="Create your first project to start grouping issues by theme or team."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDelete(project)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

// --- Project card -----------------------------------------------------------

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
  deleting: boolean;
}

function ProjectCard({ project, onDelete, deleting }: ProjectCardProps) {
  const issueCount = project.issue_count ?? 0;
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-colors hover:border-[var(--color-text-subtle)]">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? DEFAULT_COLOR }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
            {project.name}
          </h3>
          {project.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
              {project.description}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
              No description
            </p>
          )}
        </div>

        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="rounded p-1 text-[var(--color-text-muted)] opacity-0 transition-opacity hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              aria-label="Project actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        >
          <DropdownMenuItem
            className="text-[var(--color-danger)]"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete project"}
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-text-subtle)]">
        <span>
          {issueCount} issue{issueCount === 1 ? "" : "s"}
        </span>
        <span>Created {formatDate(project.created_at)}</span>
      </div>
    </div>
  );
}

// --- Create project dialog --------------------------------------------------

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);

  const createMutation = useMutation({
    mutationFn: () =>
      fetchAPI<Project>("/api/projects", {
        method: "POST",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    },
  });

  // Reset the form whenever the dialog transitions to closed.
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLOR);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !createMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) createMutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="New Project" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="project-name"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="project-description"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Description
          </label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-text)]">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((c) => {
              const selected = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  aria-pressed={selected}
                  className={cn(
                    "h-7 w-7 rounded-full border transition-transform",
                    selected
                      ? "border-white ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-surface)]"
                      : "border-[var(--color-border)] hover:scale-110",
                  )}
                  style={{ backgroundColor: c }}
                />
              );
            })}
            <label
              className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-[var(--color-border)] hover:scale-110"
              title="Custom color"
            >
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
