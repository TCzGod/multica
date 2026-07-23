import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "zh" | "en";

const STORAGE_KEY = "rnaiwork_locale";

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

/**
 * I18n store — keeps the active locale in React state and mirrors it to
 * localStorage so the preference survives reloads. The persist middleware
 * handles both the initial hydration and subsequent writes.
 */
export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "zh",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: STORAGE_KEY,
      // Only the locale itself needs to be persisted.
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
