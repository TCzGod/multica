import { useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";
import { Avatar, DropdownMenu, DropdownMenuItem } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { setWorkspaceContext } from "@/lib/api/client";
import { WorkspaceSwitcher } from "./workspace-switcher";

/**
 * Top bar of the workspace shell: workspace switcher on the left, user
 * menu on the right. Logout clears the workspace context and bounces to
 * the login page.
 */
export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    setWorkspaceContext(null);
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    // Profile editing lands in a later phase.
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <WorkspaceSwitcher />

      <DropdownMenu
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <Avatar
              src={user?.avatar_url}
              name={user?.name ?? user?.email ?? "?"}
              size="sm"
            />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-[var(--color-text)]">
                {user?.name ?? "User"}
              </span>
              <span className="block text-xs leading-tight text-[var(--color-text-muted)]">
                {user?.email}
              </span>
            </span>
          </button>
        }
        align="right"
        className="w-56"
      >
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium text-[var(--color-text)]">
            {user?.name ?? "User"}
          </div>
          {user?.email && (
            <div className="truncate text-xs text-[var(--color-text-muted)]">
              {user.email}
            </div>
          )}
        </div>
        <div className="my-1 border-t border-[var(--color-border)]" />
        <DropdownMenuItem onClick={handleProfile}>
          <UserIcon className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-[var(--color-danger)]">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenu>
    </header>
  );
}
