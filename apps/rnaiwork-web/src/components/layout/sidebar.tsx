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
import { useT } from "@/lib/i18n/use-t";
import type { TranslationKey } from "@/lib/i18n/translations";
import { Logo } from "./logo";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems: {
  to: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
}[] = [
  { to: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "issues", labelKey: "nav.issues", icon: CheckSquare },
  { to: "agents", labelKey: "nav.agents", icon: Bot },
  { to: "chat", labelKey: "nav.chat", icon: MessageSquare },
  { to: "projects", labelKey: "nav.projects", icon: FolderKanban },
  { to: "settings", labelKey: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const { workspaceSlug } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const t = useT();
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
        {navItems.map(({ to, labelKey, icon: Icon }) => (
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
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <Avatar src={user?.avatar_url ?? null} name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">
              {user?.name ?? t("user.defaultName")}
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
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
