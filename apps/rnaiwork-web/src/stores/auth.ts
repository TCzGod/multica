import { create } from "zustand";
import { toast } from "sonner";
import * as authApi from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import {
  clearLoggedInCookie,
  setLoggedInCookie,
} from "@/lib/auth-cookie";

interface AuthState {
  user: User | null;
  initialized: boolean;
  isLoading: boolean;
  init: () => Promise<void>;
  refreshMe: () => Promise<User | null>;
  sendCode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  isLoading: false,

  async init() {
    try {
      const me = await authApi.getMe();
      set({ user: me });
      return;
    } catch {
      set({ user: null });
    } finally {
      set({ initialized: true });
    }
  },

  async refreshMe() {
    try {
      const me = await authApi.getMe();
      set({ user: me });
      return me;
    } catch {
      set({ user: null });
      return null;
    }
  },

  async sendCode(email) {
    set({ isLoading: true });
    try {
      await authApi.sendCode(email);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async verifyCode(email, code) {
    set({ isLoading: true });
    try {
      await authApi.verifyCode(email, code);
      setLoggedInCookie();
      await this.refreshMe();
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Verification failed",
      );
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore — clear local state regardless */
    } finally {
      clearLoggedInCookie();
      set({ user: null });
    }
  },
}));
