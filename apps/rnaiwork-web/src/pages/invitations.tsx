import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import {
  listInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/lib/api/workspaces";
import type { Invitation } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function InvitationsPage() {
  const navigate = useNavigate();
  const { user, initialized, init } = useAuthStore();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Boot auth state, then bounce anonymous users to login.
  useEffect(() => {
    if (!initialized) void init();
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && !user) navigate("/login", { replace: true });
  }, [initialized, user, navigate]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInvitations();
      setInvitations(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load invitations.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized && user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user]);

  const handleAccept = async (inv: Invitation) => {
    setProcessingId(inv.id);
    try {
      await acceptInvitation(inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast.success(`Joined ${inv.workspace.name}.`);
      // Redirect into the accepted workspace.
      navigate(`/${inv.workspace.slug}`, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept invitation.";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inv: Invitation) => {
    setProcessingId(inv.id);
    try {
      await declineInvitation(inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast.success("Invitation declined.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to decline invitation.";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  // Still resolving the session.
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Workspace invitations
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Teams that have invited you to collaborate.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : invitations.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              You have no pending invitations.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/")}>
              Go home
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {invitations.map((inv) => {
              const disabled = processingId === inv.id;
              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span className="block truncate text-base font-medium text-[var(--color-text)]">
                      {inv.workspace.name}
                    </span>
                    <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                      Invited by {inv.inviter.name || inv.inviter.email}
                      {inv.workspace.description ? ` · ${inv.workspace.description}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => void handleAccept(inv)}
                      disabled={disabled}
                    >
                      {disabled ? <Spinner size="sm" /> : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleDecline(inv)}
                      disabled={disabled}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
