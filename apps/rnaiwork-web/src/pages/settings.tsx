import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listMembers } from "@/lib/api/workspaces";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { queryKeys } from "@/lib/query-keys";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export function SettingsPage() {
  const { workspaceSlug } = useParams();
  const current = useWorkspaceStore((s) => s.currentWorkspace);
  const user = useAuthStore((s) => s.user);

  const membersQ = useQuery({
    queryKey: workspaceSlug
      ? queryKeys.members(workspaceSlug)
      : ["members"],
    queryFn: () => listMembers(workspaceSlug!),
    enabled: !!workspaceSlug,
  });

  const members = Array.isArray(membersQ.data) ? membersQ.data : [];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-text">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1">
          <p className="text-sm text-text">
            <span className="font-medium">Name:</span>{" "}
            {current?.name ?? "—"}
          </p>
          <p className="text-sm text-text">
            <span className="font-medium">Slug:</span>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {current?.slug ?? workspaceSlug ?? "—"}
            </code>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {membersQ.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              className="m-4 border-0 p-0"
              icon={<Users />}
              title="No members"
              description="Members of this workspace will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <Avatar
                    src={m.avatar_url ?? null}
                    name={m.name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {m.name || m.email}
                      {m.id === user?.id ? " (you)" : ""}
                    </p>
                    <p className="truncate text-xs text-subtext">
                      {m.email}
                    </p>
                  </div>
                  {m.role ? (
                    <Badge variant="secondary">{m.role}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
