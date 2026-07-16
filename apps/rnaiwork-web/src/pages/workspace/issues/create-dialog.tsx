/**
 * Dialog for creating a new issue.
 *
 * Fetches the workspace's agents (assignees) and projects (optional) for its
 * dropdowns, calls createIssue on submit, and invalidates the issues list
 * query so the new issue appears immediately. Form state resets whenever the
 * dialog closes.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  Input,
  Select,
  Spinner,
  Textarea,
  type SelectOption,
} from "@/components/ui";
import { fetchAPI } from "@/lib/api";
import { createIssue } from "@/lib/api/issues";
import { listAgents } from "@/lib/api/agents";
import type { Agent, Project } from "@/lib/api";
import { PRIORITY_OPTIONS } from "./status-badge";

export interface CreateIssueDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateIssueDialog({ open, onClose }: CreateIssueDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [projectId, setProjectId] = useState("");

  // Agents and projects are shared with the list/detail pages via the same
  // query keys, so opening this dialog warms the cache for those too.
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: listAgents });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchAPI<Project[]>("/api/projects"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createIssue({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee_id: assigneeId || undefined,
        project_id: projectId || undefined,
        priority,
        status: "todo",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success("Issue created");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create issue");
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setPriority("medium");
    setProjectId("");
  }

  // Reset the form whenever the dialog transitions to closed.
  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const assigneeOptions: SelectOption[] = [
    { value: "", label: "Unassigned" },
    ...(Array.isArray(agentsQuery.data) ? agentsQuery.data : []).map((a: Agent) => ({ value: a.id, label: a.name })),
  ];

  const projectOptions: SelectOption[] = [
    { value: "", label: "No project" },
    ...(Array.isArray(projectsQuery.data) ? projectsQuery.data : []).map((p: Project) => ({ value: p.id, label: p.name })),
  ];

  const canSubmit = title.trim().length > 0 && !createMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) createMutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="New Issue" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="issue-title"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Title <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="issue-description"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Description
          </label>
          <Textarea
            id="issue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail (markdown supported)..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-text)]">
              Assignee
            </label>
            <Select
              value={assigneeId}
              onChange={setAssigneeId}
              options={assigneeOptions}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-text)]">
              Priority
            </label>
            <Select value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">
            Project
          </label>
          {projectsQuery.isLoading ? (
            <div className="flex h-9 items-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <Select value={projectId} onChange={setProjectId} options={projectOptions} />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {createMutation.isPending ? "Creating..." : "Create Issue"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default CreateIssueDialog;
