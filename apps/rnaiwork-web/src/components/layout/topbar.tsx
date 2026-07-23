import { useLocation } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspace";
import { useT } from "@/lib/i18n/use-t";
import type { TranslationKey } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "./language-switcher";

const TITLE_MAP: Record<string, TranslationKey> = {
  dashboard: "nav.dashboard",
  issues: "nav.issues",
  agents: "nav.agents",
  chat: "nav.chat",
  projects: "nav.projects",
  settings: "nav.settings",
  "new-workspace": "newWorkspace.title",
};

function titleFromPath(pathname: string, t: (key: TranslationKey) => string) {
  const seg = pathname.split("/").filter(Boolean);
  const last = seg[seg.length - 1] ?? "";
  if (!last) return t("nav.dashboard");
  const key = TITLE_MAP[last];
  if (key) return t(key);
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export function Topbar() {
  const { pathname } = useLocation();
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const t = useT();
  const title = titleFromPath(pathname, t);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <span className="text-sm font-semibold text-text">{title}</span>
      {current ? (
        <span className="text-xs text-subtext">· {current.name}</span>
      ) : null}
      <div className="ml-auto">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
