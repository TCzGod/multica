import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  createComment,
  deleteIssue,
  getIssue,
  listComments,
  listTimeline,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  updateIssue,
} from "@/lib/api/issues";
import { listMembers } from "@/lib/api/workspaces";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import type { IssuePriority, IssueStatus } from "@/lib/api/types";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatRelative } from "@/lib/utils";

export function IssueDetailPage() {
  const { workspaceSlug, issueId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const issueQ = useQuery({
    queryKey: queryKeys.issue(issueId!),
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId,
  });
  const commentsQ = useQuery({
    queryKey: queryKeys.issueComments(issueId!),
    queryFn: () => listComments(issueId!),
    enabled: !!issueId,
  });
  const timelineQ = useQuery({
    queryKey: queryKeys.issueTimeline(issueId!),
    queryFn: () => listTimeline(issueId!),
    enabled: !!issueId,
  });
  const membersQ = useQuery({
    queryKey: workspaceSlug
      ? queryKeys.members(workspaceSlug)
      : ["members"],
    queryFn: () => listMembers(workspaceSlug!),
    enabled: !!workspaceSlug,
  });
  const projectsQ = useQuery({
    queryKey: queryKeys.projects,
    queryFn: listProjects,
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string } & Record<string, unknown>) =>
      updateIssue(data.id, data as never),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issue(vars.id) });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const commentMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      createComment(id, content),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issueComments(vars.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issueTimeline(vars.id),
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Comment failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success("Issue deleted");
      navigate(`/${workspaceSlug}/issues`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  if (issueQ.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (issueQ.isError || !issueQ.data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Issue not found"
          description="This issue may have been deleted."
          action={
            <Link
              to={`/${workspaceSlug}/issues`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Back to issues
            </Link>
          }
        />
      </div>
    );
  }

  const issue = issueQ.data;
  const comments = Array.isArray(commentsQ.data) ? commentsQ.data : [];
  const timeline = Array.isArray(timelineQ.data) ? timelineQ.data : [];
  const members = Array.isArray(membersQ.data) ? membersQ.data : [];
  const projects = Array.isArray(projectsQ.data) ? projectsQ.data : [];

  const setField = (patch: Record<string, unknown>) =>
    updateMut.mutate({ id: issue.id, ...patch });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/${workspaceSlug}/issues`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleteMut.isPending}
          onClick={() => {
            if (confirm("Delete this issue?")) deleteMut.mutate(issue.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <h1 className="text-2xl font-semibold text-text">{issue.title}</h1>
      <p className="text-xs text-subtext">
        Created {formatRelative(issue.created_at)} · Updated{" "}
        {formatRelative(issue.updated_at)}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardBody>
              {issue.description ? (
                <p className="whitespace-pre-wrap text-sm text-text">
                  {issue.description}
                </p>
              ) : (
                <p className="text-sm text-subtext">
                  No description provided.
                </p>
              )}
            </CardBody>
          </Card>

          <CommentsSection
            issueId={issue.id}
            comments={comments}
            submitting={commentMut.isPending}
            onSubmit={(content) =>
              commentMut.mutate({ id: issue.id, content })
            }
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Property
                label="Status"
                value={
                  <Select
                    value={issue.status}
                    onChange={(e) =>
                      setField({ status: e.target.value as IssueStatus })
                    }
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label="Priority"
                value={
                  <Select
                    value={issue.priority ?? ""}
                    onChange={(e) =>
                      setField({
                        priority: (e.target.value || null) as IssuePriority,
                      })
                    }
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label="Assignee"
                value={
                  <Select
                    value={issue.assignee_id ?? ""}
                    onChange={(e) =>
                      setField({
                        assignee_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label="Project"
                value={
                  <Select
                    value={issue.project_id ?? ""}
                    onChange={(e) =>
                      setField({ project_id: e.target.value || null })
                    }
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {timeline.length === 0 ? (
                <p className="p-4 text-sm text-subtext">No activity yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {timeline.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-0.5 px-4 py-2"
                    >
                      <span className="text-sm text-text">
                        {ev.actor_name ?? "Someone"}{" "}
                        <span className="text-subtext">
                          {humanizeEvent(ev.type, ev.field, ev.new_value)}
                        </span>
                      </span>
                      <span className="text-xs text-subtext">
                        {formatRelative(ev.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Property({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-subtext">{label}</label>
      {value}
    </div>
  );
}

function CommentsSection({
  issueId: _issueId,
  comments,
  submitting,
  onSubmit,
}: {
  issueId: string;
  comments: { id: string; content: string; author_name?: string; author_avatar_url?: string | null; created_at: string }[];
  submitting: boolean;
  onSubmit: (content: string) => void;
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-subtext">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar
                  src={c.author_avatar_url ?? null}
                  name={c.author_name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">
                      {c.author_name ?? "Someone"}
                    </span>
                    <span className="text-xs text-subtext">
                      {formatRelative(c.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-text">
                    {c.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button disabled={submitting} onClick={submit} className="self-end">
            {submitting ? <Spinner size={14} /> : null}
            Comment
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function humanizeEvent(
  type: string,
  field?: string,
  newValue?: string | null,
) {
  if (type === "created") return "created this issue";
  if (type === "commented") return "commented";
  if (type === "status_changed" || field === "status")
    return `changed status to ${newValue ?? ""}`;
  if (type === "assignee_changed" || field === "assignee_id")
    return `set assignee to ${newValue ?? "nobody"}`;
  if (type === "priority_changed" || field === "priority")
    return `set priority to ${newValue ?? "none"}`;
  if (type === "updated") return "updated the issue";
  return type.replace(/_/g, " ");
}
