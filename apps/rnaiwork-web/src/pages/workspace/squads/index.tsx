import { useQuery } from "@tanstack/react-query";
import { Users, Plus } from "lucide-react";
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Spinner } from "@/components/ui";
import { squads } from "@/lib/api";
import type { Squad } from "@/lib/api/types";

export default function SquadsPage() {
  const { data: squadsData, isLoading, error } = useQuery({
    queryKey: ["squads"],
    queryFn: squads.listSquads,
  });

  const items = Array.isArray(squadsData) ? squadsData : [];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Squads
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Multi-agent collaboration groups
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New squad
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Failed to load squads"
              description={(error as Error).message}
            />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-12">
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No squads yet"
                description="Create a squad to enable multi-agent collaboration."
              />
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create squad
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((squad) => (
              <SquadCard key={squad.id} squad={squad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SquadCard({ squad }: { squad: Squad }) {
  return (
    <Card className="hover:bg-[var(--color-bg-secondary)] transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
            <Users className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <CardTitle className="text-base">{squad.name}</CardTitle>
            {squad.description && (
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {squad.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-xs text-[var(--color-text-muted)]">
          Created {new Date(squad.created_at).toLocaleDateString()}
        </p>
      </CardBody>
    </Card>
  );
}