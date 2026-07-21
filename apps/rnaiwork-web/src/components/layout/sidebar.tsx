import { NavLink } from "react-router-dom";
import {
  Bot,
  BookOpen,
  FolderKanban,
  ListTodo,
  Server,
  Settings,
  Play,
  Users,
  Tag,
  Mail,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "dashboard" },
  { label: "Issues", icon: ListTodo, to: "issues" },
  { label: "Agents", icon: Bot, to: "agents" },
  { label: "Autopilots", icon: Play, to: "autopilots" },
  { label: "Squads", icon: Users, to: "squads" },
  { label: "Projects", icon: FolderKanban, to: "projects" },
  { label: "Runtimes", icon: Server, to: "runtimes" },
  { label: "Skills", icon: BookOpen, to: "skills" },
  { label: "Labels", icon: Tag, to: "labels" },
  { label: "Inbox", icon: Mail, to: "inbox" },
  { label: "Settings", icon: Settings, to: "settings" },
];

export interface SidebarProps {
  workspaceSlug: string;
}

/**
 * Left navigation rail for the workspace shell. Links are relative to the
 * active `/:workspaceSlug` segment so they stay correct when switching
 * workspaces. Active state is derived from NavLink's end-match per item.
 */
export function Sidebar({ workspaceSlug }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-14 items-center border-b border-[var(--color-border)] px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={`/${workspaceSlug}/${item.to}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
