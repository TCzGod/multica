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
import { useT } from "@/lib/i18n/use-t";
import type { TranslationKey } from "@/lib/i18n/translations";
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

const STATUS_LABEL_KEYS: Record<IssueStatus, TranslationKey> = {
  backlog: "status.backlog",
  todo: "status.todo",
  in_progress: "status.in_progress",
  in_review: "status.in_review",
  done: "status.done",
  cancelled: "status.cancelled",
};

const PRIORITY_LABEL_KEYS: Record<string, TranslationKey> = {
  urgent: "priority.urgent",
  high: "priority.high",
  medium: "priority.medium",
  low: "priority.low",
};

export function IssueDetailPage() {
  const { workspaceSlug, issueId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

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
      toast.error(err instanceof Error ? err.message : t("issues.updateFailed")),
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
      toast.error(err instanceof Error ? err.message : t("issues.commentFailed")),
  });

  const deleteMut = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success(t("issues.deleted"));
      navigate(`/${workspaceSlug}/issues`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("issues.deleteFailed")),
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
          title={t("issues.notFoundTitle")}
          description={t("issues.notFoundHint")}
          action={
            <Link
              to={`/${workspaceSlug}/issues`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {t("issues.backToIssues")}
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
          {t("common.back")}
        </Link>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleteMut.isPending}
          onClick={() => {
            if (confirm(t("issues.deleteConfirm"))) deleteMut.mutate(issue.id);
          }}
        >
          <Trash2 className="size-4" />
          {t("common.delete")}
        </Button>
      </div>

      <h1 className="text-2xl font-semibold text-text">{issue.title}</h1>
      <p className="text-xs text-subtext">
        {t("issues.createdLabel")} {formatRelative(issue.created_at)} ·{" "}
        {t("issues.updatedLabel")} {formatRelative(issue.updated_at)}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("issues.description")}</CardTitle>
            </CardHeader>
            <CardBody>
              {issue.description ? (
                <p className="whitespace-pre-wrap text-sm text-text">
                  {issue.description}
                </p>
              ) : (
                <p className="text-sm text-subtext">
                  {t("issues.noDescription")}
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
              <CardTitle>{t("issues.properties")}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Property
                label={t("issues.status")}
                value={
                  <Select
                    value={issue.status}
                    onChange={(e) =>
                      setField({ status: e.target.value as IssueStatus })
                    }
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(STATUS_LABEL_KEYS[o.value])}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label={t("issues.priority")}
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
                        {o.value === null
                          ? t("priority.none")
                          : t(PRIORITY_LABEL_KEYS[o.value] ?? ("priority.none" as TranslationKey))}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label={t("issues.assignee")}
                value={
                  <Select
                    value={issue.assignee_id ?? ""}
                    onChange={(e) =>
                      setField({
                        assignee_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">{t("issues.unassigned")}</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email}
                      </option>
                    ))}
                  </Select>
                }
              />
              <Property
                label={t("issues.project")}
                value={
                  <Select
                    value={issue.project_id ?? ""}
                    onChange={(e) =>
                      setField({ project_id: e.target.value || null })
                    }
                  >
                    <option value="">{t("common.none")}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("issues.activity")}</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {timeline.length === 0 ? (
                <p className="p-4 text-sm text-subtext">{t("issues.noActivity")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {timeline.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-0.5 px-4 py-2"
                    >
                      <span className="text-sm text-text">
                        {ev.actor_name ?? t("issues.someone")}{" "}
                        <span className="text-subtext">
                          {humanizeEvent(t, ev.type, ev.field, ev.new_value)}
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
  const t = useT();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("issues.comments")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-subtext">{t("issues.noComments")}</p>
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
                      {c.author_name ?? t("issues.someone")}
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
            placeholder={t("issues.writeComment")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button disabled={submitting} onClick={submit} className="self-end">
            {submitting ? <Spinner size={14} /> : null}
            {t("issues.comment")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

type TFunc = (key: TranslationKey | string, params?: Record<string, string | number>) => string;

function humanizeEvent(
  t: TFunc,
  type: string,
  field?: string,
  newValue?: string | null,
) {
  if (type === "created") return t("issues.eventCreated");
  if (type === "commented") return t("issues.eventCommented");
  if (type === "status_changed" || field === "status") {
    const value = newValue ?? "";
    return t("issues.eventStatusChanged", { value });
  }
  if (type === "assignee_changed" || field === "assignee_id") {
    const value = newValue ?? t("issues.nobody");
    return t("issues.eventAssigneeChanged", { value });
  }
  if (type === "priority_changed" || field === "priority") {
    const value = newValue ?? t("common.none");
    return t("issues.eventPriorityChanged", { value });
  }
  if (type === "updated") return t("issues.eventUpdated");
  return type.replace(/_/g, " ");
}
