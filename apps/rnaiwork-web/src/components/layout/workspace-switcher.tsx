import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useT } from "@/lib/i18n/use-t";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrent = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const t = useT();

  return (
    <DropdownMenu
      align="start"
      className="min-w-[14rem]"
      trigger={
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-left text-sm hover:bg-muted",
            className,
          )}
        >
          <Avatar src={current?.avatar_url ?? null} name={current?.name} size="sm" />
          <span className="flex-1 truncate font-medium text-text">
            {current?.name ?? t("workspace.selectWorkspace")}
          </span>
          <ChevronsUpDown className="size-4 text-subtext" />
        </button>
      }
    >
      {(close) => (
        <>
          <DropdownMenuLabel>{t("workspace.workspaces")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Array.isArray(workspaces) && workspaces.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-subtext">
              {t("workspace.noWorkspaces")}
            </div>
          ) : null}
          {Array.isArray(workspaces) &&
            workspaces.map((ws) => {
              const active = ws.slug === current?.slug;
              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => {
                    setCurrent(ws);
                    close();
                    navigate(`/${ws.slug}/dashboard`);
                  }}
                >
                  <Avatar src={ws.avatar_url ?? null} name={ws.name} size="sm" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {active ? <Check className="size-4 text-primary" /> : null}
                </DropdownMenuItem>
              );
            })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              close();
              navigate("/new-workspace");
            }}
          >
            <Plus className="size-4" />
            {t("workspace.newWorkspace")}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenu>
  );
}
