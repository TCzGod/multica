import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { listMembers } from "@/lib/api/workspaces";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { useI18nStore, type Locale } from "@/stores/i18n";
import { queryKeys } from "@/lib/query-keys";
import { useT } from "@/lib/i18n/use-t";
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
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

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
      <h1 className="text-xl font-semibold text-text">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.workspace")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1">
          <p className="text-sm text-text">
            <span className="font-medium">{t("settings.name")}:</span>{" "}
            {current?.name ?? "—"}
          </p>
          <p className="text-sm text-text">
            <span className="font-medium">{t("settings.slug")}:</span>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {current?.slug ?? workspaceSlug ?? "—"}
            </code>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          <p className="text-sm text-subtext">{t("language.switch")}</p>
          <div className="flex gap-2">
            {(["zh", "en"] as Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={
                  "rounded-md border px-3 py-1.5 text-sm " +
                  (code === locale
                    ? "border-primary bg-primary-muted text-primary"
                    : "border-border bg-surface text-subtext hover:bg-muted hover:text-text")
                }
              >
                {t(code === "zh" ? "language.zh" : "language.en")}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.members")}</CardTitle>
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
              title={t("settings.noMembers")}
              description={t("settings.membersHint")}
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
                      {m.id === user?.id ? t("settings.you") : ""}
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
