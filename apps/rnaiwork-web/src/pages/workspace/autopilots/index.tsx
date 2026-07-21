import { useQuery } from "@tanstack/react-query";
import { Bot, Play, Plus } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Spinner } from "@/components/ui";
import { autopilots } from "@/lib/api";
import type { Autopilot } from "@/lib/api/types";

export default function AutopilotsPage() {
  const { data: autopilotsData, isLoading, error } = useQuery({
    queryKey: ["autopilots"],
    queryFn: autopilots.listAutopilots,
  });

  const items = Array.isArray(autopilotsData) ? autopilotsData : [];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Autopilots
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Automated workflows that run on a schedule
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New autopilot
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={<Bot className="h-8 w-8" />}
              title="Failed to load autopilots"
              description={(error as Error).message}
            />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-12">
              <EmptyState
                icon={<Bot className="h-8 w-8" />}
                title="No autopilots yet"
                description="Create an autopilot to automate repetitive tasks."
              />
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create autopilot
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((autopilot) => (
              <AutopilotCard key={autopilot.id} autopilot={autopilot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AutopilotCard({ autopilot }: { autopilot: Autopilot }) {
  return (
    <Card className="hover:bg-[var(--color-bg-secondary)] transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
              <Bot className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <CardTitle className="text-base">{autopilot.name}</CardTitle>
              {autopilot.description && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {autopilot.description}
                </p>
              )}
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              autopilot.status === "active"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-text-subtle)]/10 text-[var(--color-text-muted)]"
            }`}
          >
            <Play className="h-3 w-3" />
            {autopilot.status}
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-xs text-[var(--color-text-muted)]">
          Created {new Date(autopilot.created_at).toLocaleDateString()}
        </p>
      </CardBody>
    </Card>
  );
}