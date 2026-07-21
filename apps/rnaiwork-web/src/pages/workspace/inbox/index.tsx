import { useQuery } from "@tanstack/react-query";
import { Mail, Plus } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Spinner } from "@/components/ui";
import { inbox } from "@/lib/api";
import type { InboxItem } from "@/lib/api/types";

export default function InboxPage() {
  const { data: inboxData, isLoading, error } = useQuery({
    queryKey: ["inbox"],
    queryFn: inbox.listInbox,
  });

  const items = Array.isArray(inboxData) ? inboxData : [];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Inbox
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              External messages and notifications
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={<Mail className="h-8 w-8" />}
              title="Failed to load inbox"
              description={(error as Error).message}
            />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-12">
              <EmptyState
                icon={<Mail className="h-8 w-8" />}
                title="No inbox items"
                description="Your inbox is empty."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <InboxItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InboxItemCard({ item }: { item: InboxItem }) {
  return (
    <Card className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
        <Mail className="h-5 w-5 text-[var(--color-accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {item.title}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              item.status === "read"
                ? "bg-[var(--color-text-subtle)]/10 text-[var(--color-text-muted)]"
                : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            }`}
          >
            {item.status}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
          {item.content}
        </p>
      </div>
      <span className="shrink-0 text-xs text-[var(--color-text-subtle)]">
        {new Date(item.created_at).toLocaleDateString()}
      </span>
    </Card>
  );
}