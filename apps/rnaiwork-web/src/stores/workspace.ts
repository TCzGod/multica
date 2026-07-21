import { create } from "zustand";
import { toast } from "sonner";
import * as workspacesApi from "@/lib/api/workspaces";
import { setWorkspaceContext } from "@/lib/api/client";
import type { Workspace } from "@/lib/api/types";

const LAST_WORKSPACE_KEY = "rnaiwork:last-workspace-slug";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  error: string | null;
  loaded: boolean;
  loadWorkspaces: () => Promise<Workspace[]>;
  setCurrentWorkspace: (ws: Workspace) => void;
  createWorkspace: (data: {
    name: string;
    slug?: string;
    description?: string;
  }) => Promise<Workspace | null>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  error: null,
  loaded: false,

  async loadWorkspaces() {
    try {
      const list = await workspacesApi.listWorkspaces();
      const safe = Array.isArray(list) ? list : [];
      set({ workspaces: safe, error: null });

      const lastSlug = localStorage.getItem(LAST_WORKSPACE_KEY);
      const next =
        safe.find((w) => w.slug === lastSlug) ?? safe[0] ?? null;

      if (next) {
        setWorkspaceContext({ slug: next.slug, id: next.id });
        set({ currentWorkspace: next });
      } else {
        setWorkspaceContext({ slug: null, id: null });
        set({ currentWorkspace: null });
      }
      return safe;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspaces";
      set({ error: message });
      return [];
    } finally {
      set({ loaded: true });
    }
  },

  setCurrentWorkspace(ws) {
    set({ currentWorkspace: ws });
    setWorkspaceContext({ slug: ws.slug, id: ws.id });
    if (ws.slug) {
      localStorage.setItem(LAST_WORKSPACE_KEY, ws.slug);
    }
  },

  async createWorkspace(data) {
    try {
      const ws = await workspacesApi.createWorkspace(data);
      const list = [...get().workspaces, ws];
      set({ workspaces: list });
      return ws;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create workspace",
      );
      return null;
    }
  },
}));
