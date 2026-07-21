import { useQuery } from "@tanstack/react-query";
import { Tag, Plus } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Spinner } from "@/components/ui";
import { labels } from "@/lib/api";
import type { Label } from "@/lib/api/types";

export default function LabelsPage() {
  const { data: labelsData, isLoading, error } = useQuery({
    queryKey: ["labels"],
    queryFn: labels.listLabels,
  });

  const items = Array.isArray(labelsData) ? labelsData : [];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Labels
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Categorize and organize issues
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New label
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={<Tag className="h-8 w-8" />}
              title="Failed to load labels"
              description={(error as Error).message}
            />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-12">
              <EmptyState
                icon={<Tag className="h-8 w-8" />}
                title="No labels yet"
                description="Create labels to categorize your issues."
              />
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create label
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((label) => (
              <LabelCard key={label.id} label={label} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabelCard({ label }: { label: Label }) {
  return (
    <Card className="flex items-center gap-3 p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      <span className="text-sm font-medium text-[var(--color-text)]">
        {label.name}
      </span>
    </Card>
  );
}