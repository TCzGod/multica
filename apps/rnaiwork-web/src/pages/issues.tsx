import { useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { LayoutGrid, List as ListIcon, Plus } from "lucide-react";
import {
  createIssue,
  listIssues,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  updateIssue,
} from "@/lib/api/issues";
import { listMembers } from "@/lib/api/workspaces";
import { listProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";
import { useT } from "@/lib/i18n/use-t";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { Issue, IssuePriority, IssueStatus } from "@/lib/api/types";
import type { Member, Project } from "@/lib/api/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { cn, formatDate, getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* i18n key maps                                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Shared display helpers                                              */
/* ------------------------------------------------------------------ */

const BADGE_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "success",
  "warning",
  "danger",
] as const;
type BadgeVariant = (typeof BADGE_VARIANTS)[number];

const STATUS_BADGE: Record<IssueStatus, BadgeVariant> = {
  backlog: "secondary",
  todo: "secondary",
  in_progress: "default",
  in_review: "warning",
  done: "success",
  cancelled: "outline",
};

const PRIORITY_BADGE: Record<string, BadgeVariant> = {
  urgent: "danger",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-danger",
  high: "bg-warning",
  medium: "bg-subtext",
  low: "bg-border",
};

/** Ordered columns for the kanban board. Cancelled is opt-in. */
const BOARD_COLUMNS: { status: IssueStatus; labelKey: TranslationKey }[] = [
  { status: "backlog", labelKey: "status.backlog" },
  { status: "todo", labelKey: "status.todo" },
  { status: "in_progress", labelKey: "status.in_progress" },
  { status: "in_review", labelKey: "status.in_review" },
  { status: "done", labelKey: "status.done" },
];

const ALL_STATUSES = STATUS_OPTIONS.map((o) => o.value);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type ViewMode = "board" | "list";

export function IssuesPage() {
  const { workspaceSlug } = useParams();
  const queryClient = useQueryClient();
  const t = useT();

  const [view, setView] = useState<ViewMode>("board");
  const [showCancelled, setShowCancelled] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [createStatus, setCreateStatus] = useState<IssueStatus>("backlog");
  const [createOpen, setCreateOpen] = useState(false);

  // Board pulls all issues (no status filter) and groups client-side so
  // optimistic status updates stay under a single cache key.
  const issuesQ = useQuery({
    queryKey: queryKeys.issues({}),
    queryFn: () => listIssues(),
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

  const createMut = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      toast.success(t("issues.created"));
      setCreateOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("issues.createFailed")),
  });

  const updateStatusMut = useMutation({
    mutationFn: (vars: { id: string; status: IssueStatus }) =>
      updateIssue(vars.id, { status: vars.status }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });
      const snapshot = queryClient.getQueryData<Issue[]>(queryKeys.issues({}));
      queryClient.setQueryData<Issue[]>(queryKeys.issues({}), (old) =>
        Array.isArray(old)
          ? old.map((i) =>
              i.id === vars.id
                ? {
                    ...i,
                    status: vars.status,
                    updated_at: new Date().toISOString(),
                  }
                : i,
            )
          : old,
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(queryKeys.issues({}), ctx.snapshot);
      }
      toast.error(t("issues.moveFailed"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const allIssues = Array.isArray(issuesQ.data) ? issuesQ.data : [];
  const members = Array.isArray(membersQ.data) ? membersQ.data : [];
  const projects = Array.isArray(projectsQ.data) ? projectsQ.data : [];

  const memberMap = useMemo(() => {
    const m = new Map<string, Member>();
    members.forEach((mb) => m.set(mb.id, mb));
    return m;
  }, [members]);
  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  // Apply project / assignee filters client-side.
  const filteredIssues = useMemo(() => {
    return allIssues.filter((i) => {
      if (projectFilter !== "all" && i.project_id !== projectFilter)
        return false;
      if (assigneeFilter !== "all" && i.assignee_id !== assigneeFilter)
        return false;
      return true;
    });
  }, [allIssues, projectFilter, assigneeFilter]);

  const openCreate = (status: IssueStatus = "backlog") => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{t("issues.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8 w-40 text-xs"
          >
            <option value="all">{t("issues.allProjects")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-8 w-40 text-xs"
          >
            <option value="all">{t("issues.allAssignees")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email}
              </option>
            ))}
          </Select>

          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                view === "board"
                  ? "bg-surface text-text shadow-sm"
                  : "text-subtext hover:text-text",
              )}
            >
              <LayoutGrid className="size-3.5" />
              {t("issues.board")}
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-surface text-text shadow-sm"
                  : "text-subtext hover:text-text",
              )}
            >
              <ListIcon className="size-3.5" />
              {t("issues.list")}
            </button>
          </div>

          <Button size="sm" onClick={() => openCreate("backlog")}>
            <Plus className="size-4" />
            {t("issues.newIssue")}
          </Button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {issuesQ.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredIssues.length === 0 && allIssues.length === 0 ? (
          <EmptyState
            title={t("issues.emptyStateTitle")}
            description={t("issues.emptyStateHint")}
            action={
              <Button size="sm" onClick={() => openCreate("backlog")}>
                <Plus className="size-4" />
                {t("issues.newIssue")}
              </Button>
            }
          />
        ) : view === "board" ? (
          <KanbanBoard
            workspaceSlug={workspaceSlug}
            issues={filteredIssues}
            memberMap={memberMap}
            projectMap={projectMap}
            showCancelled={showCancelled}
            onToggleCancelled={() => setShowCancelled((v) => !v)}
            onMove={(id, status) =>
              updateStatusMut.mutate({ id, status })
            }
            onNew={openCreate}
            pendingMove={updateStatusMut.isPending}
          />
        ) : (
          <IssueListView
            workspaceSlug={workspaceSlug}
            issues={filteredIssues}
            memberMap={memberMap}
            projectMap={projectMap}
          />
        )}
      </div>

      <CreateIssueDialog
        open={createOpen}
        defaultStatus={createStatus}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMut.mutate(data)}
        submitting={createMut.isPending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kanban board                                                        */
/* ------------------------------------------------------------------ */

function KanbanBoard({
  workspaceSlug,
  issues,
  memberMap,
  projectMap,
  showCancelled,
  onToggleCancelled,
  onMove,
  onNew,
  pendingMove,
}: {
  workspaceSlug?: string;
  issues: Issue[];
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  showCancelled: boolean;
  onToggleCancelled: () => void;
  onMove: (id: string, status: IssueStatus) => void;
  onNew: (status: IssueStatus) => void;
  pendingMove: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const t = useT();

  const columns = showCancelled
    ? [
        ...BOARD_COLUMNS,
        {
          status: "cancelled" as IssueStatus,
          labelKey: "status.cancelled" as TranslationKey,
        },
      ]
    : BOARD_COLUMNS;

  const grouped = useMemo(() => {
    const map = new Map<IssueStatus, Issue[]>();
    for (const status of ALL_STATUSES) map.set(status, []);
    for (const issue of issues) {
      const bucket = map.get(issue.status);
      if (bucket) bucket.push(issue);
    }
    return map;
  }, [issues]);

  const activeIssue = activeId
    ? issues.find((i) => i.id === activeId) ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const issue = issues.find((i) => i.id === String(active.id));
    if (!issue) return;
    const newStatus = String(over.id) as IssueStatus;
    if (!ALL_STATUSES.includes(newStatus)) return;
    if (newStatus === issue.status) return;
    onMove(issue.id, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-2">
        {columns.map((col) => {
          const items = Array.isArray(grouped.get(col.status))
            ? grouped.get(col.status)!
            : [];
          return (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={t(col.labelKey)}
              issues={items}
              workspaceSlug={workspaceSlug}
              memberMap={memberMap}
              projectMap={projectMap}
              onNew={() => onNew(col.status)}
              pendingMove={pendingMove}
            />
          );
        })}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onToggleCancelled}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-subtext hover:bg-muted"
          >
            {showCancelled ? t("issues.hideCancelled") : t("issues.showCancelled")}
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <KanbanCardContent
            issue={activeIssue}
            memberMap={memberMap}
            projectMap={projectMap}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  label,
  issues,
  workspaceSlug,
  memberMap,
  projectMap,
  onNew,
  pendingMove,
}: {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  workspaceSlug?: string;
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  onNew: () => void;
  pendingMove: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const t = useT();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40",
        isOver && "border-primary/50 bg-primary-muted/40",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{label}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-subtext">
            {issues.length}
          </span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {issues.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-subtext">
            {t("issues.emptyColumn")}
          </div>
        ) : (
          issues.map((issue) => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              workspaceSlug={workspaceSlug}
              memberMap={memberMap}
              projectMap={projectMap}
              pendingMove={pendingMove}
            />
          ))
        )}
      </div>
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-subtext hover:bg-muted hover:text-text"
        >
          <Plus className="size-3.5" />
          {t("issues.new")}
        </button>
      </div>
    </div>
  );
}

function KanbanCard({
  issue,
  workspaceSlug,
  memberMap,
  projectMap,
  pendingMove,
}: {
  issue: Issue;
  workspaceSlug?: string;
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  pendingMove: boolean;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: issue.id,
      data: { status: issue.status },
    });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: pendingMove ? "progress" : "grab",
  };

  const handleClick = () => {
    if (isDragging) return;
    navigate(`/${workspaceSlug}/issues/${issue.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/${workspaceSlug}/issues/${issue.id}`);
        }
      }}
      className="group rounded-md border border-border bg-surface p-2.5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <KanbanCardContent
        issue={issue}
        memberMap={memberMap}
        projectMap={projectMap}
      />
    </div>
  );
}

function KanbanCardContent({
  issue,
  memberMap,
  projectMap,
  dragging,
}: {
  issue: Issue;
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  dragging?: boolean;
}) {
  const t = useT();
  const assignee = issue.assignee_id ? memberMap.get(issue.assignee_id) : null;
  const project = issue.project_id ? projectMap.get(issue.project_id) : null;
  const priority = issue.priority ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1.5">
        {priority ? (
          <span
            className={cn(
              "mt-1 inline-block size-2 shrink-0 rounded-full",
              PRIORITY_DOT[priority] ?? "bg-subtext",
            )}
            title={t("issues.priorityLabel", { value: priority })}
          />
        ) : null}
        <p
          className={cn(
            "min-w-0 flex-1 text-sm font-medium text-text",
            dragging && "font-semibold",
          )}
        >
          {issue.title}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {priority ? (
            <Badge variant={PRIORITY_BADGE[priority] ?? "secondary"}>
              {t(PRIORITY_LABEL_KEYS[priority] ?? ("priority.none" as TranslationKey))}
            </Badge>
          ) : null}
          {project ? (
            <span className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-subtext">
              {project.title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-subtext">
            {formatDate(issue.updated_at)}
          </span>
          {assignee ? (
            <Avatar
              src={assignee.avatar_url ?? null}
              name={assignee.name || assignee.email}
              size="sm"
            />
          ) : (
            <span
              className="inline-flex size-6 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-subtext"
              title={t("issues.unassigned")}
            >
              {getInitials(null)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List view                                                           */
/* ------------------------------------------------------------------ */

function IssueListView({
  workspaceSlug,
  issues,
  memberMap,
  projectMap,
}: {
  workspaceSlug?: string;
  issues: Issue[];
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
}) {
  const t = useT();
  if (issues.length === 0) {
    return (
      <EmptyState
        className="border-0 p-0"
        title={t("issues.noMatchesTitle")}
        description={t("issues.noMatchesHint")}
      />
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {issues.map((issue) => {
          const assignee = issue.assignee_id
            ? memberMap.get(issue.assignee_id)
            : null;
          const project = issue.project_id
            ? projectMap.get(issue.project_id)
            : null;
          return (
            <li key={issue.id}>
              <Link
                to={`/${workspaceSlug}/issues/${issue.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                  {issue.title}
                </span>
                {project ? (
                  <span className="hidden rounded bg-muted px-1.5 py-0.5 text-[11px] text-subtext sm:inline">
                    {project.title}
                  </span>
                ) : null}
                {assignee ? (
                  <Avatar
                    src={assignee.avatar_url ?? null}
                    name={assignee.name || assignee.email}
                    size="sm"
                  />
                ) : null}
                {issue.priority ? (
                  <Badge variant={PRIORITY_BADGE[issue.priority] ?? "secondary"}>
                    {t(PRIORITY_LABEL_KEYS[issue.priority] ?? ("priority.none" as TranslationKey))}
                  </Badge>
                ) : null}
                <Badge variant={STATUS_BADGE[issue.status]}>
                  {t(STATUS_LABEL_KEYS[issue.status])}
                </Badge>
                <span className="w-24 text-right text-xs text-subtext">
                  {formatDate(issue.updated_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Create issue dialog                                                 */
/* ------------------------------------------------------------------ */

function CreateIssueDialog({
  open,
  defaultStatus,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  defaultStatus: IssueStatus;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
  }) => void;
  submitting: boolean;
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>(defaultStatus);
  const [priority, setPriority] = useState<IssuePriority>("medium");

  // Sync the default status whenever the dialog is opened with a new column.
  const [lastDefault, setLastDefault] = useState<IssueStatus>(defaultStatus);
  if (open && defaultStatus !== lastDefault) {
    setLastDefault(defaultStatus);
    if (!title) setStatus(defaultStatus);
  }

  const submit = () => {
    if (!title.trim()) {
      toast.error(t("issues.titleRequired"));
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus(defaultStatus);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{t("issues.newIssue")}</DialogTitle>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <Input
          placeholder={t("issues.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          placeholder={t("issues.descriptionOptional")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">{t("issues.status")}</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(STATUS_LABEL_KEYS[o.value])}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtext">{t("issues.priority")}</label>
            <Select
              value={priority ?? ""}
              onChange={(e) =>
                setPriority((e.target.value || null) as IssuePriority)
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
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button disabled={submitting} onClick={submit}>
          {submitting ? <Spinner size={14} /> : null}
          {t("common.create")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
