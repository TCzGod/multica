import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", text, className)}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-fg text-xs">
        R
      </span>
      <span className="text-text">RNAIWork</span>
    </span>
  );
}
