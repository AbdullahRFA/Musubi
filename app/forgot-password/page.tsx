"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, MailCheck, RefreshCw } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validators";
import { requestPasswordReset } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthError, AuthField, Spinner } from "@/components/auth/AuthShell";

const RESEND_COOLDOWN = 60;

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  // Errors forwarded from an expired / invalid reset link
  useEffect(() => {
    const e = searchParams.get("error");
    if (e && e !== "no_code") setError(decodeURIComponent(e));
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (email: string) => {
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim().toLowerCase());
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err?.message || "Could not send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link href="/login" className="group inline-flex items-center gap-1.5 font-bold text-primary hover:underline underline-offset-4">
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      Back to log in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthShell
        icon={MailCheck}
        title="Check your inbox"
        description="If an account exists for this email, we've sent a link to reset your password."
        footer={backToLogin}
      >
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-success/30 bg-success/5 p-4 text-sm text-foreground text-center animate-in fade-in zoom-in-95">
            Reset link sent to <strong className="break-all">{sentTo}</strong>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• The link expires after one hour and can be used once.</li>
            <li>• Open it on this device and browser for the smoothest experience.</li>
            <li>• Can&apos;t find it? Check your spam or promotions folder.</li>
          </ul>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={cooldown > 0 || loading}
            onClick={() => send(sentTo)}
          >
            {loading ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </Button>
          <AuthError message={error} />
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="block w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Forgot your password?"
      description="Enter the email you signed up with and we'll send you a secure reset link."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit((v) => send(v.email))} className="space-y-4" noValidate>
        <AuthError message={error} />
        <AuthField id="email" label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            placeholder="you@example.com"
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </AuthField>
        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading ? (
            <>
              <Spinner /> Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Signed up with Google? You can sign in with Google instead — no password needed.
        </p>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
