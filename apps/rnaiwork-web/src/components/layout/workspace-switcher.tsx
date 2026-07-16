import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Dropdown for switching the active workspace. Lists every workspace the
 * user belongs to, highlights the current one, and navigates to the new
 * workspace's dashboard on selection. A "Create workspace" action sits at
 * the bottom — wired to the dashboard route for now (creation UI lands in
 * a later phase).
 */
export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const handleSelect = (slug: string) => {
    navigate(`/${slug}/dashboard`);
  };

  const handleCreate = () => {
    // Creation flow lands in a later phase; route to settings for now.
    if (currentWorkspace) {
      navigate(`/${currentWorkspace.slug}/settings`);
    }
  };

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <span className="max-w-[140px] truncate">
            {currentWorkspace?.name ?? "Select workspace"}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-[var(--color-text-subtle)]" />
        </button>
      }
      className="w-64"
    >
      <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
        Workspaces
      </div>
      <div className="max-h-64 overflow-y-auto">
        {workspaces.length === 0 && (
          <div className="px-2 py-3 text-sm text-[var(--color-text-muted)]">
            No workspaces yet.
          </div>
        )}
        {workspaces.map((ws) => {
          const isActive = currentWorkspace?.id === ws.id;
          return (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => handleSelect(ws.slug)}
              className="justify-between"
            >
              <span className="truncate">{ws.name}</span>
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-[var(--color-accent)]"
                    : "text-transparent",
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </div>
      <div className="my-1 border-t border-[var(--color-border)]" />
      <DropdownMenuItem
        onClick={handleCreate}
        className="text-[var(--color-text-muted)]"
      >
        <Plus className="h-4 w-4" />
        Create workspace
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
