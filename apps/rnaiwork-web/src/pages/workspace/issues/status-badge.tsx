/**
 * Reusable badge components + option lists for issue status and priority.
 *
 * Status and priority are rendered in several places (list, detail, create
 * dialog), so the color/label mapping lives here once. Colors use Tailwind's
 * palette with low-opacity tints so they read well on the dark theme without
 * competing with the CSS-variable-based surfaces used elsewhere.
 */
import { Badge, type SelectOption } from "@/components/ui";
import { cn } from "@/lib/utils";

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

export type IssuePriority = "low" | "medium" | "high" | "urgent";

interface BadgeMeta {
  label: string;
  className: string;
}

const STATUS_META: Record<IssueStatus, BadgeMeta> = {
  backlog: { label: "Backlog", className: "bg-gray-500/15 text-gray-300 border-gray-500/30" },
  todo: { label: "To Do", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  in_progress: { label: "In Progress", className: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  in_review: { label: "In Review", className: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  done: { label: "Done", className: "bg-green-500/15 text-green-300 border-green-500/30" },
  cancelled: { label: "Cancelled", className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const PRIORITY_META: Record<IssuePriority, BadgeMeta> = {
  low: { label: "Low", className: "bg-gray-500/15 text-gray-300 border-gray-500/30" },
  medium: { label: "Medium", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  high: { label: "High", className: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  urgent: { label: "Urgent", className: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const FALLBACK_META: BadgeMeta = {
  label: "Unknown",
  className: "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

/** Select options for every status value, in display order. */
export const STATUS_OPTIONS: SelectOption[] = (
  Object.keys(STATUS_META) as IssueStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));

/** Select options for every priority value, in display order. */
export const PRIORITY_OPTIONS: SelectOption[] = (
  Object.keys(PRIORITY_META) as IssuePriority[]
).map((value) => ({ value, label: PRIORITY_META[value].label }));

/** Human-readable label for a status value (falls back to the raw string). */
export function statusLabel(status: string): string {
  return STATUS_META[status as IssueStatus]?.label ?? status;
}

/** Human-readable label for a priority value (falls back to the raw string). */
export function priorityLabel(priority: string): string {
  return PRIORITY_META[priority as IssuePriority]?.label ?? priority;
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

/** Renders an issue status as a colored Badge. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status as IssueStatus] ?? FALLBACK_META;
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {meta.label}
    </Badge>
  );
}

export interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

/** Renders an issue priority as a colored Badge. */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority as IssuePriority] ?? FALLBACK_META;
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
