import { create } from "zustand";
import type { User } from "@/lib/api/types";
import { getMe, logout as apiLogout, getConfig } from "@/lib/api/auth";
import type { AppConfig } from "@/lib/api/types";

interface AuthState {
  user: User | null;
  config: AppConfig | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  init: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  config: null,
  loading: false,
  initialized: false,
  error: null,
  init: async () => {
    set({ loading: true, error: null });
    try {
      const [user, config] = await Promise.all([getMe(), getConfig()]);
      set({ user, config, loading: false, initialized: true });
    } catch (err) {
      // Not logged in — this is normal
      set({ user: null, loading: false, initialized: true });
      // Still try to get config (public endpoint)
      try {
        const config = await getConfig();
        set({ config });
      } catch {}
    }
  },
  refreshUser: async () => {
    try {
      const user = await getMe();
      set({ user });
    } catch (err) {
      set({ user: null });
    }
  },
  logout: async () => {
    try { await apiLogout(); } catch {}
    set({ user: null });
  },
  clearError: () => set({ error: null }),
}));
