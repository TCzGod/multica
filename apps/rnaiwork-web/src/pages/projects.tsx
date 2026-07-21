import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderKanban, Plus } from "lucide-react";
import { createProject, listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const projectsQ = useQuery({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
  });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setOpen(false);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to create project",
      ),
  });

  const projects = Array.isArray(projectsQ.data) ? projectsQ.data : [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Projects</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      <Card>
        {projectsQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            className="m-4 border-0 p-0"
            icon={<FolderKanban />}
            title="No projects yet"
            description="Group related issues into a project."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New project
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-text">{p.name}</span>
                {p.description ? (
                  <span className="truncate text-xs text-subtext">
                    {p.description}
                  </span>
                ) : null}
                {p.updated_at ? (
                  <span className="text-xs text-subtext">
                    {formatRelative(p.updated_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CreateProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(data) => createMut.mutate(data)}
        submitting={createMut.isPending}
      />
    </div>
  );
}

function CreateProjectDialog({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>New project</DialogTitle>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={submitting} onClick={submit}>
          {submitting ? <Spinner size={14} /> : null}
          Create
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
