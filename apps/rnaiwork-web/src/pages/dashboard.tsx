import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  CheckSquare,
  Bot,
  FolderKanban,
  ListChecks,
} from "lucide-react";
import { listAgents } from "@/lib/api/agents";
import { listIssues } from "@/lib/api/issues";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";
import type { IssueStatus } from "@/lib/api/types";
import type { ReactNode } from "react";

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

export function DashboardPage() {
  const { workspaceSlug } = useParams();
  const issuesQ = useQuery({
    queryKey: queryKeys.issues(),
    queryFn: () => listIssues(),
  });
  const agentsQ = useQuery({
    queryKey: queryKeys.agents,
    queryFn: listAgents,
  });
  const projectsQ = useQuery({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
  });

  const loading =
    issuesQ.isLoading || agentsQ.isLoading || projectsQ.isLoading;

  const issues = Array.isArray(issuesQ.data) ? issuesQ.data : [];
  const agents = Array.isArray(agentsQ.data) ? agentsQ.data : [];
  const projects = Array.isArray(projectsQ.data) ? projectsQ.data : [];

  const activeAgents = agents.filter((a) => !a.is_archived);

  const byStatus = (status: IssueStatus) =>
    issues.filter((i) => i.status === status).length;

  const recent = [...issues]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <Link
          to={`/${workspaceSlug}/issues`}
          className={cn(buttonVariants())}
        >
          View all issues
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<ListChecks />}
              label="Open issues"
              value={issues.length}
            />
            <StatCard
              icon={<CheckSquare />}
              label="In progress"
              value={byStatus("in_progress") + byStatus("in_review")}
            />
            <StatCard
              icon={<Bot />}
              label="Active agents"
              value={activeAgents.length}
            />
            <StatCard
              icon={<FolderKanban />}
              label="Projects"
              value={projects.length}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent issues</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {recent.length === 0 ? (
                <EmptyState
                  className="m-4 border-0 p-0"
                  title="No issues yet"
                  description="Create your first issue to start tracking work."
                  action={
                    <Link
                      to={`/${workspaceSlug}/issues`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Go to issues
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((issue) => (
                    <li key={issue.id}>
                      <Link
                        to={`/${workspaceSlug}/issues/${issue.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                          {issue.title}
                        </span>
                        <Badge variant="secondary">
                          {STATUS_LABELS[issue.status]}
                        </Badge>
                        <span className="text-xs text-subtext">
                          {formatDate(issue.updated_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-muted text-primary [&_svg]:size-4">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold text-text">{value}</p>
          <p className="text-xs text-subtext">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
