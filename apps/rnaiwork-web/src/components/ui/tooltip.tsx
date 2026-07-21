import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal tooltip: relies on the native `title` attribute for accessibility,
 * with an optional custom wrapper. Keeps the bundle dependency-free.
 */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span title={typeof content === "string" ? content : undefined} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
