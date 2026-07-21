import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { slugify } from "@/lib/utils";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NewWorkspacePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  if (initialized && !user) {
    return <Navigate to="/login" replace />;
  }
  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const onSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    setSubmitting(true);
    const ws = await createWorkspace({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
    });
    setSubmitting(false);
    if (ws) {
      toast.success("Workspace created");
      navigate(`/${ws.slug}/dashboard`);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2">
            <Logo />
          </div>
          <CardTitle>Create a workspace</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Name</label>
            <Input
              placeholder="My team"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-text">Slug</label>
            <Input
              placeholder="my-team"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-text">
              Description
            </label>
            <Textarea
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            disabled={submitting}
            onClick={() => void onSubmit()}
          >
            {submitting ? <Spinner size={14} /> : null}
            Create workspace
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
