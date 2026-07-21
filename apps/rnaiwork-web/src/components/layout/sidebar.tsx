import { NavLink, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Bot,
  MessageSquare,
  FolderKanban,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { Logo } from "./logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "issues", label: "Issues", icon: CheckSquare },
  { to: "agents", label: "Agents", icon: Bot },
  { to: "chat", label: "Chat", icon: MessageSquare },
  { to: "projects", label: "Projects", icon: FolderKanban },
  { to: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { workspaceSlug } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const base = workspaceSlug
    ? `/${workspaceSlug}`
    : current
      ? `/${current.slug}`
      : "/";

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="px-3 py-3">
        <Logo />
      </div>
      <div className="px-2 pb-3">
        <WorkspaceSwitcher />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`${base}/${to}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-muted text-primary"
                  : "text-subtext hover:bg-muted hover:text-text",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <Avatar src={user?.avatar_url ?? null} name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-subtext">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void logout();
          }}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-subtext hover:bg-muted hover:text-text"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
