import { cn } from "@/lib/utils";

/**
 * RNAIWork text logo with a geometric asterisk mark.
 *
 * Pure CSS / inline SVG — no image assets. The mark is an eight-point
 * star rendered with two rotated squares to read as a stylized "*",
 * evoking the "compound / multiply" idea behind the product.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)]">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight text-[var(--color-text)]">
        RNAIWork
      </span>
    </div>
  );
}
