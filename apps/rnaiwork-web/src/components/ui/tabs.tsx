import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, value, onChange, children, className }: TabsProps) {
  return (
    <div className={className}>
      <div className="flex border-b border-[var(--color-border)]" role="tablist">
        {tabs.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
      {children && <div className="pt-4">{children}</div>}
    </div>
  );
}
