/**
 * Issue list page.
 *
 * Renders a filterable table of issues for the active workspace. The filter
 * state (search, status, assignee) is part of the query key so each filter
 * combination is cached independently. Clicking a row navigates to the issue
 * detail view at /:workspaceSlug/issues/:issueId.
 *
 * Rendered at /:workspaceSlug/issues (see src/router/index.tsx).
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CircleDot, Plus, Search } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  Spinner,
  type SelectOption,
} from "@/components/ui";
import { listIssues, type ListIssuesParams } from "@/lib/api/issues";
import { listAgents } from "@/lib/api/agents";
import type { Agent, Issue } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CreateIssueDialog } from "./create-dialog";
import { STATUS_OPTIONS, StatusBadge, PriorityBadge } from "./status-badge";

const SKELETON_ROWS = 6;

export default function IssuesListPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Debounce the search input so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters: ListIssuesParams = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      assignee_id: assigneeId || undefined,
    }),
    [search, status, assigneeId],
  );

  const issuesQuery = useQuery({
    queryKey: ["issues", filters],
    queryFn: () => listIssues(filters),
  });

  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: listAgents });

  const statusFilterOptions: SelectOption[] = [
    { value: "", label: "All statuses" },
    ...STATUS_OPTIONS,
  ];

  const assigneeFilterOptions: SelectOption[] = [
    { value: "", label: "All assignees" },
    ...(agentsQuery.data ?? []).map((a: Agent) => ({ value: a.id, label: a.name })),
  ];

  const hasActiveFilters = Boolean(search || status || assigneeId);
  const issues = issuesQuery.data ?? [];

  function openIssue(issue: Issue) {
    navigate(`/${workspaceSlug}/issues/${issue.id}`);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Issues
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Track work across your workspace
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Issue
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-6 py-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search issues..."
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onChange={setStatus}
          options={statusFilterOptions}
          className="w-auto min-w-[10rem]"
        />
        <Select
          value={assigneeId}
          onChange={setAssigneeId}
          options={assigneeFilterOptions}
          className="w-auto min-w-[10rem]"
        />
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto">
        {issuesQuery.isLoading ? (
          <IssueListSkeleton rows={SKELETON_ROWS} />
        ) : issuesQuery.isError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-[var(--color-danger)]">
              Failed to load issues
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
              {issuesQuery.error instanceof Error
                ? issuesQuery.error.message
                : "Something went wrong."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => issuesQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : issues.length === 0 ? (
          <EmptyState
            className="py-20"
            icon={<CircleDot className="h-10 w-10" />}
            title={
              hasActiveFilters ? "No matching issues" : "No issues yet"
            }
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Create your first issue to start tracking work in this workspace."
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setStatus("");
                    setAssigneeId("");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create your first issue
                </Button>
              )
            }
          />
        ) : (
          <IssueTable issues={issues} onOpen={openIssue} />
        )}
      </div>

      <CreateIssueDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

/** Column headers shared by the table and skeleton. */
const COLUMN_LABELS = ["#", "Title", "Status", "Priority", "Assignee", "Project", "Created"];

function IssueTable({
  issues,
  onOpen,
}: {
  issues: Issue[];
  onOpen: (issue: Issue) => void;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-subtle)]">
          <th className="px-6 py-2 font-medium" style={{ width: "4rem" }}>
            {COLUMN_LABELS[0]}
          </th>
          <th className="px-3 py-2 font-medium">{COLUMN_LABELS[1]}</th>
          <th className="px-3 py-2 font-medium" style={{ width: "9rem" }}>
            {COLUMN_LABELS[2]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "8rem" }}>
            {COLUMN_LABELS[3]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "10rem" }}>
            {COLUMN_LABELS[4]}
          </th>
          <th className="px-3 py-2 font-medium" style={{ width: "10rem" }}>
            {COLUMN_LABELS[5]}
          </th>
          <th className="px-6 py-2 font-medium" style={{ width: "8rem" }}>
            {COLUMN_LABELS[6]}
          </th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} onOpen={onOpen} />
        ))}
      </tbody>
    </table>
  );
}

function IssueRow({
  issue,
  onOpen,
}: {
  issue: Issue;
  onOpen: (issue: Issue) => void;
}) {
  return (
    <tr
      onClick={() => onOpen(issue)}
      className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]"
    >
      <td className="px-6 py-3 text-[var(--color-text-subtle)]">
        #{issue.number}
      </td>
      <td className="px-3 py-3">
        <span className="font-medium text-[var(--color-text)]">{issue.title}</span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={issue.status} />
      </td>
      <td className="px-3 py-3">
        <PriorityBadge priority={issue.priority} />
      </td>
      <td className="px-3 py-3">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar src={issue.assignee.avatar_url} name={issue.assignee.name} size="sm" />
            <span className="truncate text-[var(--color-text-muted)]">
              {issue.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-[var(--color-text-subtle)]">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        {issue.project ? (
          <Badge variant="outline" className="gap-1.5">
            {issue.project.color && (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: issue.project.color }}
              />
            )}
            {issue.project.name}
          </Badge>
        ) : (
          <span className="text-[var(--color-text-subtle)]">—</span>
        )}
      </td>
      <td className="px-6 py-3 text-[var(--color-text-muted)]">
        {formatDate(issue.created_at)}
      </td>
    </tr>
  );
}

/** Placeholder rows shown while the list is loading. */
function IssueListSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-3">
        <Spinner size="sm" />
        <span className="text-sm text-[var(--color-text-muted)]">Loading issues...</span>
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-[var(--color-border)]">
              <td className="px-6 py-3">
                <div className="h-4 w-8 animate-pulse rounded bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-3 py-3">
                <div className="h-5 w-20 animate-pulse rounded bg-[var(--color-surface-2)]" />
              </td>
              <td className="px-6 py-3">
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-surface-2)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
