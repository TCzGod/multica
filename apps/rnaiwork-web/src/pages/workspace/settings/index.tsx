/**
 * Workspace settings page.
 *
 * Tabbed view with three sections:
 *  - General: edit workspace name, slug, and description (updateWorkspace).
 *  - Members: list members with roles and invite by email (listMembers,
 *    createInvitation).
 *  - Danger: permanently delete the workspace (deleteWorkspace).
 *
 * The active workspace comes from useWorkspaceStore; the workspace ID from
 * that record scopes every member/invitation call.
 *
 * Rendered at /:workspaceSlug/settings (see src/router/index.tsx).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Save, Trash2, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Input,
  Select,
  Spinner,
  Tabs,
  Textarea,
  type SelectOption,
  type TabItem,
} from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  createInvitation,
  deleteWorkspace,
  listMembers,
  updateWorkspace,
} from "@/lib/api/workspaces";
import type { Member, Workspace } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type TabValue = "general" | "members" | "danger";

const TABS: TabItem[] = [
  { value: "general", label: "General" },
  { value: "members", label: "Members" },
  { value: "danger", label: "Danger Zone" },
];

/** Roles an inviter can assign. Owner is excluded — it transfers separately. */
const ROLE_OPTIONS: SelectOption[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

export default function SettingsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [tab, setTab] = useState<TabValue>("general");

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          Manage workspace preferences, members, and lifecycle
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <Tabs tabs={TABS} value={tab} onChange={(v) => setTab(v as TabValue)}>
          {tab === "general" && <GeneralTab workspace={currentWorkspace} />}
          {tab === "members" && <MembersTab workspace={currentWorkspace} />}
          {tab === "danger" && <DangerTab workspace={currentWorkspace} />}
        </Tabs>
      </div>
    </div>
  );
}

// --- General tab ------------------------------------------------------------

function GeneralTab({ workspace }: { workspace: Workspace }) {
  const queryClient = useQueryClient();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [description, setDescription] = useState(workspace.description ?? "");

  // Re-sync local form state if the workspace record changes externally.
  useEffect(() => {
    setName(workspace.name);
    setSlug(workspace.slug);
    setDescription(workspace.description ?? "");
  }, [workspace]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateWorkspace(workspace.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (updated) => {
      setCurrentWorkspace(updated);
      // Refresh any cached workspace lists / scoped data keyed by slug.
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace updated");
      // If the slug changed, the current URL is stale — redirect to the
      // canonical settings path under the new slug.
      if (updated.slug !== workspace.slug) {
        navigate(`/${updated.slug}/settings`);
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update workspace");
    },
  });

  const dirty =
    name.trim() !== workspace.name ||
    slug.trim() !== workspace.slug ||
    (description.trim() || "") !== (workspace.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dirty && name.trim() && slug.trim()) updateMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="ws-name"
          className="text-sm font-medium text-[var(--color-text)]"
        >
          Workspace name
        </label>
        <Input
          id="ws-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ws-slug"
          className="text-sm font-medium text-[var(--color-text)]"
        >
          Slug
        </label>
        <Input
          id="ws-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="font-mono"
          required
        />
        <p className="text-xs text-[var(--color-text-subtle)]">
          Used in the workspace URL: /{slug || "your-slug"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ws-description"
          className="text-sm font-medium text-[var(--color-text)]"
        >
          Description
        </label>
        <Textarea
          id="ws-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this workspace for?"
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || updateMutation.isPending}>
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// --- Members tab ------------------------------------------------------------

function MembersTab({ workspace }: { workspace: Workspace }) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["members", workspace.id],
    queryFn: () => listMembers(workspace.id),
  });

  const members = Array.isArray(membersQuery.data) ? membersQuery.data : [];

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Members
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </div>

      {membersQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : membersQuery.isError ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Couldn't load members"
          description={
            membersQuery.error instanceof Error
              ? membersQuery.error.message
              : "Something went wrong. Please try again."
          }
          action={
            <Button variant="outline" onClick={() => membersQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No members"
          description="Invite teammates to collaborate in this workspace."
        />
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </ul>
      )}

      <InviteDialog
        workspaceId={workspace.id}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar src={member.avatar_url} name={member.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text)]">
          {member.name}
        </p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">
          {member.email}
        </p>
      </div>
      <RoleBadge role={member.role} />
    </li>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variant =
    role === "owner"
      ? "default"
      : role === "admin"
        ? "warning"
        : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {role}
    </Badge>
  );
}

function InviteDialog({
  workspaceId,
  open,
  onClose,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(workspaceId, email.trim(), role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      toast.success(`Invitation sent to ${email.trim()}`);
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    },
  });

  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("member");
    }
  }, [open]);

  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !inviteMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) inviteMutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invite member" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="invite-email"
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Email <span className="text-[var(--color-danger)]">*</span>
          </label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">
            Role
          </label>
          <Select value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {inviteMutation.isPending ? "Sending..." : "Send invitation"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// --- Danger tab -------------------------------------------------------------

function DangerTab({ workspace }: { workspace: Workspace }) {
  const navigate = useNavigate();
  const { loadWorkspaces } = useWorkspaceStore();

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspace.id),
    onSuccess: () => {
      toast.success("Workspace deleted");
      // Refresh the workspace list so the deleted workspace is gone, then
      // bounce to the root so the shell picks the next workspace (or onboarding).
      void loadWorkspaces();
      navigate("/");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete workspace");
    },
  });

  function handleDelete() {
    const confirmName = window.prompt(
      `This will permanently delete "${workspace.name}" and all of its data. Type the workspace name to confirm:`,
    );
    if (confirmName === null) return;
    if (confirmName.trim() !== workspace.name) {
      toast.error("Workspace name did not match. Deletion cancelled.");
      return;
    }
    deleteMutation.mutate();
  }

  const isOwner = workspace.role === "owner";

  return (
    <div className="max-w-xl">
      <div
        className={cn(
          "rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-5",
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Delete this workspace
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Permanently delete <span className="font-medium">{workspace.name}</span>{" "}
              and all of its issues, agents, projects, and history. This action
              cannot be undone.
            </p>
            <Button
              variant="danger"
              className="mt-4"
              onClick={handleDelete}
              disabled={!isOwner || deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMutation.isPending ? "Deleting..." : "Delete workspace"}
            </Button>
            {!isOwner && (
              <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                Only the workspace owner can delete it.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
