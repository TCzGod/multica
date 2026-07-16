/**
 * Issue detail page.
 *
 * Two-column layout: the main column holds the editable title, description,
 * and a Comments / Activity tabbed section; the sidebar holds metadata
 * (status, priority, assignee, project, labels, timestamps). Every field is
 * editable inline and persisted via updateIssue, with optimistic cache
 * updates so the UI stays responsive.
 *
 * Rendered at /:workspaceSlug/issues/:issueId (see src/router/index.tsx).
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  Pencil,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Select,
  Spinner,
  Tabs,
  Textarea,
} from "@/components/ui";
import { fetchAPI } from "@/lib/api";
import {
  createComment,
  getIssue,
  listComments,
  listTimeline,
  updateIssue,
} from "@/lib/api/issues";
import { listAgents } from "@/lib/api/agents";
import type { Agent, Comment, Issue, Project, TimelineEvent } from "@/lib/api";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  StatusBadge,
} from "./status-badge";

export default function IssuesDetailPage() {
  const { workspaceSlug, issueId } = useParams<{
    workspaceSlug: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const issueQuery = useQuery({
    queryKey: ["issue", issueId],
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId,
  });
  const commentsQuery = useQuery({
    queryKey: ["issue", issueId, "comments"],
    queryFn: () => listComments(issueId!),
    enabled: !!issueId,
  });
  const timelineQuery = useQuery({
    queryKey: ["issue", issueId, "timeline"],
    queryFn: () => listTimeline(issueId!),
    enabled: !!issueId,
  });
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: listAgents });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchAPI<Project[]>("/api/projects"),
  });

  const issue = issueQuery.data;

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Issue>) => updateIssue(issueId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["issue", issueId], updated);
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update issue");
    },
  });

  function patch(data: Partial<Issue>) {
    if (!issueId) return;
    updateMutation.mutate(data);
  }

  if (issueQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (issueQuery.isError || !issue) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--color-danger)]">Failed to load issue</p>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
          {issueQuery.error instanceof Error
            ? issueQuery.error.message
            : "This issue may not exist or you don't have access."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate(`/${workspaceSlug}/issues`)}
        >
          Back to issues
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/${workspaceSlug}/issues`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span>#{issue.number}</span>
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-auto p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          <EditableTitle
            title={issue.title}
            onSave={(title) => patch({ title })}
            saving={updateMutation.isPending}
          />

          <DescriptionEditor
            description={issue.description ?? ""}
            onSave={(description) => patch({ description })}
            saving={updateMutation.isPending}
          />

          <CommentsSection
            comments={commentsQuery.data ?? []}
            loading={commentsQuery.isLoading}
            issueId={issueId!}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <Card>
            <CardBody className="space-y-4">
              <SidebarRow label="Status">
                <Select
                  value={issue.status}
                  onChange={(v) => patch({ status: v })}
                  options={STATUS_OPTIONS}
                  disabled={updateMutation.isPending}
                />
              </SidebarRow>
              <SidebarRow label="Priority">
                <Select
                  value={issue.priority}
                  onChange={(v) => patch({ priority: v })}
                  options={PRIORITY_OPTIONS}
                  disabled={updateMutation.isPending}
                />
              </SidebarRow>
              <SidebarRow label="Assignee">
                <Select
                  value={issue.assignee_id ?? ""}
                  onChange={(v) => patch({ assignee_id: v })}
                  options={[
                    { value: "", label: "Unassigned" },
                    ...(agentsQuery.data ?? []).map((a: Agent) => ({
                      value: a.id,
                      label: a.name,
                    })),
                  ]}
                  disabled={updateMutation.isPending || agentsQuery.isLoading}
                />
              </SidebarRow>
              <SidebarRow label="Project">
                {projectsQuery.isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <Select
                    value={issue.project_id ?? ""}
                    onChange={(v) => patch({ project_id: v })}
                    options={[
                      { value: "", label: "No project" },
                      ...(projectsQuery.data ?? []).map((p: Project) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                    disabled={updateMutation.isPending}
                  />
                )}
              </SidebarRow>
              <SidebarRow label="Labels">
                {issue.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {issue.labels.map((label) => (
                      <Badge key={label.id} variant="outline" className="gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-[var(--color-text-subtle)]">None</span>
                )}
              </SidebarRow>
              <div className="space-y-2 border-t border-[var(--color-border)] pt-3 text-sm">
                <MetaLine label="Created" value={formatDate(issue.created_at)} />
                <MetaLine
                  label="Updated"
                  value={formatRelativeTime(issue.updated_at)}
                />
              </div>
            </CardBody>
          </Card>

          <ActivityCard
            events={timelineQuery.data ?? []}
            loading={timelineQuery.isLoading}
          />
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Title                                                                      */
/* -------------------------------------------------------------------------- */

function EditableTitle({
  title,
  onSave,
  saving,
}: {
  title: string;
  onSave: (title: string) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  function commit() {
    const next = draft.trim();
    if (!next || next === title) {
      setEditing(false);
      setDraft(title);
      return;
    }
    onSave(next);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="text-lg font-semibold"
        />
        <div className="flex flex-col gap-1">
          <Button size="icon" variant="default" onClick={commit} disabled={saving}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setDraft(title);
              setEditing(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-[var(--color-text-subtle)] opacity-0 transition-opacity hover:text-[var(--color-text-muted)] group-hover:opacity-100"
        aria-label="Edit title"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Description                                                                */
/* -------------------------------------------------------------------------- */

function DescriptionEditor({
  description,
  onSave,
  saving,
}: {
  description: string;
  onSave: (description: string) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  useEffect(() => {
    if (!editing) setDraft(description);
  }, [description, editing]);

  function commit() {
    if (draft === description) {
      setEditing(false);
      return;
    }
    onSave(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          autoFocus
          placeholder="Describe the issue (markdown supported)..."
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(description);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={commit} disabled={saving}>
            <Check className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
          Description
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      {description.trim() ? (
        <div className="whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)]">
          {description}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full rounded-md border border-dashed border-[var(--color-border)] px-4 py-3 text-left text-sm text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          Add a description...
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Comments + Activity (tabs)                                                 */
/* -------------------------------------------------------------------------- */

function CommentsSection({
  comments,
  loading,
  issueId,
}: {
  comments: Comment[];
  loading: boolean;
  issueId: string;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("comments");
  const [draft, setDraft] = useState("");

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment(issueId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId, "comments"] });
      setDraft("");
      toast.success("Comment added");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    },
  });

  function submit() {
    const content = draft.trim();
    if (!content || commentMutation.isPending) return;
    commentMutation.mutate(content);
  }

  return (
    <div>
      <Tabs
        tabs={[
          { value: "comments", label: `Comments (${comments.length})` },
          { value: "activity", label: "Activity" },
        ]}
        value={tab}
        onChange={setTab}
      >
        {tab === "comments" ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 py-4">
                <Spinner size="sm" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  Loading comments...
                </span>
              </div>
            ) : comments.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-text-muted)]">
                No comments yet. Start the conversation below.
              </p>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </ul>
            )}

            <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={!draft.trim() || commentMutation.isPending}
                >
                  <MessageSquare className="h-4 w-4" />
                  {commentMutation.isPending ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-sm text-[var(--color-text-muted)]">
            Activity timeline loads here when the issue has events.
          </p>
        )}
      </Tabs>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const author = comment.author;
  const name = author?.name ?? "Unknown";
  const subtitle =
    comment.author_type === "agent" ? "Agent" : comment.author_type === "user" ? "User" : null;

  return (
    <li className="flex gap-3">
      <Avatar src={author?.avatar_url} name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">{name}</span>
          {subtitle && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {subtitle}
            </Badge>
          )}
          <span className="text-xs text-[var(--color-text-subtle)]">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
          {comment.content}
        </p>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar helpers                                                            */
/* -------------------------------------------------------------------------- */

function SidebarRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-subtle)]">{label}</span>
      <span className="text-[var(--color-text-muted)]">{value}</span>
    </div>
  );
}

function ActivityCard({
  events,
  loading,
}: {
  events: TimelineEvent[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-subtle)]">
          Activity
        </h3>
        {loading ? (
          <Spinner size="sm" />
        ) : events.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <div className="min-w-0">
                  <p className="text-[var(--color-text-muted)]">{event.content}</p>
                  <span className="text-xs text-[var(--color-text-subtle)]">
                    {formatRelativeTime(event.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
