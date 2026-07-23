import { Globe, Check } from "lucide-react";
import { useI18nStore, type Locale } from "@/stores/i18n";
import { useT } from "@/lib/i18n/use-t";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LOCALES: Locale[] = ["zh", "en"];

/**
 * Compact language toggle. Shows the active locale's short code next to a
 * globe icon and opens a dropdown with both supported locales.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const t = useT();

  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          aria-label={t("language.switch")}
          title={t("language.switch")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-medium text-subtext hover:bg-muted hover:text-text",
            className,
          )}
        >
          <Globe className="size-3.5" />
          <span className="uppercase">{locale}</span>
        </button>
      }
    >
      {(close) => (
        <>
          <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LOCALES.map((code) => (
            <DropdownMenuItem
              key={code}
              onClick={() => {
                setLocale(code);
                close();
              }}
            >
              <span className="flex-1">{t(code === "zh" ? "language.zh" : "language.en")}</span>
              {code === locale ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
          ))}
        </>
      )}
    </DropdownMenu>
  );
}
