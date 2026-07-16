/**
 * Provider badge for agent rows / cards.
 *
 * Maps the backend `provider` slug to a human-readable label and a color
 * theme. Colors use translucent backgrounds with a brighter text shade so
 * they read well on the dark surface (see index.css --color-surface).
 */
import { Badge, type BadgeProps } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ProviderConfig {
  /** Display label shown in the badge. */
  label: string;
  /** Tailwind classes for bg / text / border, scoped to a provider hue. */
  className: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  claude: {
    label: "Claude Code",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  codex: {
    label: "Codex",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  copilot: {
    label: "GitHub Copilot",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  openclaw: {
    label: "OpenClaw",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  opencode: {
    label: "OpenCode",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  },
  hermes: {
    label: "Hermes",
    className: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  },
  gemini: {
    label: "Gemini",
    className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  },
  pi: {
    label: "Pi",
    className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  "cursor-agent": {
    label: "Cursor Agent",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  kimi: {
    label: "Kimi",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  "kiro-cli": {
    label: "Kiro CLI",
    className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  "qoder-cli": {
    label: "Qoder CLI",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
};

const FALLBACK: ProviderConfig = {
  label: "Unknown",
  className: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

export interface ProviderBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  /** Provider slug from the Agent.provider field. */
  provider: string;
  /** Override the label; defaults to the provider's configured label. */
  label?: string;
}

/** Lookup table exported for the create-agent dialog so the dropdown and
 *  the badge stay in sync. */
export const PROVIDER_SLUGS = Object.keys(PROVIDERS);

/** Resolve a provider slug to its display label. */
export function providerLabel(provider: string): string {
  return (PROVIDERS[provider] ?? FALLBACK).label;
}

export function ProviderBadge({ provider, label, className, ...props }: ProviderBadgeProps) {
  const config = PROVIDERS[provider] ?? FALLBACK;
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      {...props}
    >
      {label ?? config.label}
    </Badge>
  );
}
