import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ClipboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { sendCode, verifyCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const CODE_LENGTH = 6;
const COOLDOWN_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, initialized, init, refreshUser } = useAuthStore();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize auth state on mount if the app shell hasn't already.
  useEffect(() => {
    if (!initialized) void init();
  }, [initialized, init]);

  // Redirect to the app once we confirm an authenticated session.
  useEffect(() => {
    if (initialized && user) navigate("/", { replace: true });
  }, [initialized, user, navigate]);

  // Countdown ticker for the resend cooldown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const startCooldown = (s = COOLDOWN_SECONDS) => setCooldown(s);

  const focusCodeBox = (i: number) => {
    const idx = Math.max(0, Math.min(i, CODE_LENGTH - 1));
    inputs.current[idx]?.focus();
  };

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendCode(trimmed);
      setStep("code");
      setCode(Array(CODE_LENGTH).fill(""));
      startCooldown();
      window.setTimeout(() => focusCodeBox(0), 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Rate limited — a code is likely already in flight. Move to the
        // code step and enforce the cooldown so the user can't spam resend.
        setStep("code");
        setCode(Array(CODE_LENGTH).fill(""));
        startCooldown();
        toast.warning("Too many requests. Please wait before requesting a new code.");
        window.setTimeout(() => focusCodeBox(0), 0);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to send code.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const full = code.join("");
    if (full.length !== CODE_LENGTH) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      await verifyCode(email.trim(), full);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
      toast.error(msg);
      setCode(Array(CODE_LENGTH).fill(""));
      focusCodeBox(0);
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < CODE_LENGTH - 1) focusCodeBox(i + 1);
  };

  const handleCodeKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      focusCodeBox(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusCodeBox(i - 1);
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      focusCodeBox(i + 1);
    }
  };

  const handleCodePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    focusCodeBox(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const busy = sending || verifying;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))" }}
            >
              R
            </span>
            <span className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              RNAIWork
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 shadow-2xl backdrop-blur-sm">
          {step === "email" ? (
            <>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Sign in</h1>
              <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
                Enter your email and we&apos;ll send a verification code.
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy) void handleSendCode();
                }}
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-[var(--color-text-muted)]"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                  />
                </div>

                {error && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {sending ? (
                    <>
                      <Spinner size="sm" /> Sending…
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Enter code</h1>
              <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-[var(--color-text)]">{email.trim()}</span>
              </p>

              <form
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!busy) void handleVerify();
                }}
              >
                <div
                  className="flex justify-between gap-2"
                  onPaste={handleCodePaste}
                >
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      disabled={busy}
                      aria-label={`Digit ${i + 1}`}
                      className="h-12 w-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center text-lg font-semibold text-[var(--color-text)] transition-colors focus:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {verifying ? (
                    <>
                      <Spinner size="sm" /> Verifying…
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                      setCode(Array(CODE_LENGTH).fill(""));
                    }}
                    className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                    disabled={busy}
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSendCode()}
                    disabled={cooldown > 0 || busy}
                    className="font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:text-[var(--color-text-subtle)]"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-subtle)]">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
