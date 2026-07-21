import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { Mail } from "lucide-react";

/** Placeholder invitations page — reserved for future invite-acceptance flow. */
export function InvitationsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="p-6">
      <EmptyState
        icon={<Mail />}
        title="No pending invitations"
        description="Workspace invitations you accept will appear here."
      />
    </div>
  );
}
