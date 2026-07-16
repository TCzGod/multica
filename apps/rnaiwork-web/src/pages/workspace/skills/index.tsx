/**
 * Skills list page.
 *
 * Renders the workspace's skills as a table with expandable rows. Each row
 * shows the skill name, description, and created/updated dates; expanding it
 * reveals the skill's markdown content. "New Skill" opens a dialog collecting
 * a name and description. Data is fetched via listSkills() and cache
 * invalidation is shared with the rest of the app under ["skills"].
 *
 * Rendered at /:workspaceSlug/skills (see src/router/index.tsx).
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  Spinner,
  Textarea,
} from "@/components/ui";
import { listSkills } from "@/lib/api/skills";
import { fetchAPI } from "@/lib/api/client";
import type { Skill } from "@/lib/api/types";
import { cn, formatDate } from "@/lib/utils";

export default function SkillsPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const skillsQuery = useQuery({
    queryKey: ["skills"],
    queryFn: listSkills,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchAPI<void>(`/api/skills/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete skill");
    },
  });

  function handleDelete(skill: Skill) {
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(skill.id);
    if (expandedId === skill.id) setExpandedId(null);
  }

  const skills = Array.isArray(skillsQuery.data) ? skillsQuery.data : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Skills
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Reusable capabilities that can be attached to agents
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Skill
        </Button>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto">
        {skillsQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : skillsQuery.isError ? (
          <EmptyState
            className="py-20"
            icon={<FileText className="h-8 w-8" />}
            title="Couldn't load skills"
            description={
              skillsQuery.error instanceof Error
                ? skillsQuery.error.message
                : "Something went wrong. Please try again."
            }
            action={
              <Button variant="outline" onClick={() => skillsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : skills.length === 0 ? (
          <EmptyState
            className="py-20"
            icon={<FileText className="h-10 w-10" />}
            title="No skills yet"
            description="Create your first skill to package instructions agents can reuse across tasks."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first skill
              </Button>
            }
          />
        ) : (
          <SkillTable
            skills={skills}
            expandedId={expandedId}
            onToggle={(id) =>
              setExpandedId((cur) => (cur === id ? null : id))
            }
            onDelete={handleDelete}
            deleting={deleteMutation.isPending}
          />
        )}
      </div>

      <CreateSkillDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

// --- Table ------------------------------------------------------------------

const COLUMNS = ["", "Name", "Description", "Created", "Updated", ""];

function SkillTable({
  skills,
  expandedId,
  onToggle,
  onDelete,
  deleting,
}: {
  skills: Skill[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onDelete: (skill: Skill) => void;
  deleting: boolean;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-subtle)]">
          <th className="px-6 py-2 font-medium" style={{ width: "2.5rem" }}>
            {COLUMNS[0]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "16rem" }}>
            {COLUMNS[1]}
          </th>
          <th className="px-3 py-2 font-medium">{COLUMNS[2]}</th>
          <th className="px-3 py-2 font-medium" style={{ width: "9rem" }}>
            {COLUMNS[3]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "9rem" }}>
            {COLUMNS[4]}
          </th>
          <th className="px-6 py-2 font-medium" style={{ width: "3rem" }}>
            {COLUMNS[5]}
          </th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            expanded={expandedId === skill.id}
            onToggle={() => onToggle(skill.id)}
            onDelete={() => onDelete(skill)}
            deleting={deleting}
          />
        ))}
      </tbody>
    </table>
  );
}

function SkillRow({
  skill,
  expanded,
  onToggle,
  onDelete,
  deleting,
}: {
  skill: Skill;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <>
      <tr className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]">
        <td className="px-6 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            aria-label={expanded ? "Collapse skill" : "Expand skill"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-left font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]"
          >
            {skill.name}
          </button>
        </td>
        <td className="px-3 py-3">
          {skill.description ? (
            <span className="line-clamp-1 text-[var(--color-text-muted)]">
              {skill.description}
            </span>
          ) : (
            <span className="text-[var(--color-text-subtle)]">No description</span>
          )}
        </td>
        <td className="px-3 py-3 text-[var(--color-text-muted)]">
          {formatDate(skill.created_at)}
        </td>
        <td className="px-3 py-3 text-[var(--color-text-muted)]">
          {formatDate(skill.updated_at)}
        </td>
        <td className="px-6 py-3 text-right">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)] disabled:opacity-50"
            aria-label="Delete skill"
            title="Delete skill"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <td colSpan={6} className="px-6 py-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
              Content
            </div>
            {skill.content ? (
              <pre
                className={cn(
                  "max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-xs text-[var(--color-text-muted)]",
                )}
              >
                {skill.content}
              </pre>
            ) : (
              <p className="text-sm text-[var(--color-text-subtle)]">
                This skill has no content yet.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// --- Create skill dialog ----------------------------------------------------

interface CreateSkillDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateSkillDialog({ open, onClose }: CreateSkillDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      fetchAPI<Skill>("/api/skills", {
        method: "POST",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill created");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create skill");
    },
  });

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !createMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) createMutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="New Skill" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="skill-name"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            id="skill-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Code Reviewer"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="skill-description"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Description
          </label>
          <Textarea
            id="skill-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this skill do?"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {createMutation.isPending ? "Creating..." : "Create Skill"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
