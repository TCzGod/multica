import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useT } from "@/lib/i18n/use-t";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const sendCode = useAuthStore((s) => s.sendCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const t = useT();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  if (initialized && user) {
    return <Navigate to="/" replace />;
  }

  const onSendCode = async () => {
    if (!email.trim()) {
      toast.error(t("register.invalidEmail"));
      return;
    }
    const ok = await sendCode(email.trim());
    if (ok) setStep("code");
  };

  const onVerify = async () => {
    if (!code.trim()) {
      toast.error(t("register.enterCode"));
      return;
    }
    const ok = await verifyCode(email.trim(), code.trim());
    if (ok) {
      toast.success(t("register.success"));
      await loadWorkspaces();
      const ws = useWorkspaceStore.getState().currentWorkspace;
      navigate(ws ? `/${ws.slug}/dashboard` : "/new-workspace");
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2">
            <Logo />
          </div>
          <CardTitle>{t("register.title")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {step === "email" ? (
            <>
              <label className="text-sm font-medium text-text">
                {t("register.email")}
              </label>
              <Input
                type="email"
                placeholder={t("register.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onSendCode();
                }}
              />
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={() => void onSendCode()}
              >
                {isLoading ? <Spinner size={14} /> : null}
                {isLoading
                  ? t("register.sending")
                  : t("register.signUpButton")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-subtext">
                {t("register.codeSentHint")}{" "}
                <span className="font-medium text-text">{email}</span>.
              </p>
              <label className="text-sm font-medium text-text">
                {t("register.code")}
              </label>
              <Input
                placeholder={t("register.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onVerify();
                }}
              />
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={() => void onVerify()}
              >
                {isLoading ? <Spinner size={14} /> : null}
                {isLoading
                  ? t("register.verifying")
                  : t("register.verifyButton")}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("email")}
              >
                {t("register.useDifferentEmail")}
              </Button>
            </>
          )}
          <p className="pt-2 text-center text-sm text-subtext">
            {t("login.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              {t("login.toLogin")}
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
