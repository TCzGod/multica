/**
 * Shared utility functions for the RNAIWork web frontend.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict } from "date-fns";

/** Merge Tailwind CSS classes with proper precedence. Combines clsx
 *  (conditional classes) with tailwind-merge (conflict resolution). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a date as "MMM d, yyyy" (e.g. "Jan 5, 2026"). Accepts an ISO
 *  string or a Date instance. */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

/** Format a date as a relative time string (e.g. "2 hours ago", "3 days
 *  ago"). Accepts an ISO string or a Date instance. */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

/** Format a byte count into a human-readable string (e.g. "1.5 KB",
 *  "2 MB"). Uses 1024-based units. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

/** Get up to two uppercase initials from a name (e.g. "Ada Lovelace" →
 *  "AL", "Grace" → "GR"). Returns an empty string for falsy input. */
export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
