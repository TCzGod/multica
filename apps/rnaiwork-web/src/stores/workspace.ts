import { create } from "zustand";
import type { Workspace } from "@/lib/api/types";
import { listWorkspaces } from "@/lib/api/workspaces";
import { setWorkspaceContext } from "@/lib/api/client";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  loadWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  setCurrentWorkspaceBySlug: (slug: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
  loadWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const workspaces = await listWorkspaces();
      // Restore last workspace from localStorage
      const lastSlug = localStorage.getItem("last_workspace_slug");
      const current = lastSlug
        ? workspaces.find(w => w.slug === lastSlug) ?? workspaces[0] ?? null
        : workspaces[0] ?? null;

      if (current) {
        setWorkspaceContext({ slug: current.slug, id: current.id });
        localStorage.setItem("last_workspace_slug", current.slug);
      }

      set({ workspaces, currentWorkspace: current, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message ?? "Failed to load workspaces" });
    }
  },
  setCurrentWorkspace: (workspace) => {
    setWorkspaceContext({ slug: workspace.slug, id: workspace.id });
    localStorage.setItem("last_workspace_slug", workspace.slug);
    set({ currentWorkspace: workspace });
  },
  setCurrentWorkspaceBySlug: (slug) => {
    const ws = get().workspaces.find(w => w.slug === slug);
    if (ws) get().setCurrentWorkspace(ws);
  },
}));
