import { useLocation } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspace";

function titleFromPath(pathname: string) {
  const seg = pathname.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? "";
  if (!last) return "Dashboard";
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    issues: "Issues",
    agents: "Agents",
    chat: "Chat",
    projects: "Projects",
    settings: "Settings",
    "new-workspace": "New Workspace",
  };
  return map[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}

export function Topbar() {
  const { pathname } = useLocation();
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const title = titleFromPath(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <span className="text-sm font-semibold text-text">{title}</span>
      {current ? (
        <span className="text-xs text-subtext">· {current.name}</span>
      ) : null}
    </header>
  );
}
