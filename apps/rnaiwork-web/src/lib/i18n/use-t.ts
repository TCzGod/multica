import { useCallback } from "react";
import { useI18nStore } from "@/stores/i18n";
import { translations, type TranslationKey } from "./translations";

/**
 * Translation hook. Returns a memoized `t(key, params?)` function that looks
 * up the active locale's dictionary. Keys are flat strings using dot-separated
 * namespaces (e.g. `"nav.dashboard"`). Unknown keys fall back to the key
 * itself so missing translations surface visibly without crashing.
 *
 * Optional `{name}` style placeholders in a translation string are replaced
 * from the `params` map.
 */
export function useT() {
  const locale = useI18nStore((s) => s.locale);

  return useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>) => {
      const dict = translations[locale] as Record<string, string>;
      let value = dict[key as string];
      if (value === undefined) {
        // Fall back to the other locale, then to the raw key.
        const fallback = translations[locale === "zh" ? "en" : "zh"] as Record<
          string,
          string
        >;
        value = fallback[key as string] ?? (key as string);
      }
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return value;
    },
    [locale],
  );
}
