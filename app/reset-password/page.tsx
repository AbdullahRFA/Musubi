"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validators";
import { hasActiveSession, updatePassword } from "@/lib/services/authService";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthError, AuthField, PasswordInput, PasswordStrength, Spinner } from "@/components/auth/AuthShell";

type LinkState = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<LinkState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = watch("password");

  // The reset link establishes a short-lived recovery session (via
  // /auth/callback, or the URL hash for implicit-flow links). Wait briefly for
  // it before deciding the link is invalid.
  useEffect(() => {
    let settled = false;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session && !settled) {
        settled = true;
        setState("ready");
      }
    });
    hasActiveSession().then((ok) => {
      if (ok && !settled) {
        settled = true;
        setState("ready");
      }
    });
    const timeout = setTimeout(() => {
      if (!settled) setState("invalid");
    }, 2500);
    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => router.push("/posts"), 2500);
    return () => clearTimeout(t);
  }, [state, router]);

  const onSubmit = async (values: ResetPasswordValues) => {
    setError(null);
    setLoading(true);
    try {
      await updatePassword(values.password);
      setState("done");
    } catch (err: any) {
      setError(err?.message || "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  if (state === "checking") {
    return (
      <AuthShell icon={LockKeyhole} title="Verifying your link" description="One moment while we confirm your reset link...">
        <div className="flex justify-center py-6">
          <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (state === "invalid") {
    return (
      <AuthShell
        icon={ShieldAlert}
        title="Link expired or invalid"
        description="Password reset links expire after an hour and can only be used once."
        footer={
          <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4">
            Back to log in
          </Link>
        }
      >
        <Button asChild className="w-full font-bold">
          <Link href="/forgot-password">Request a new reset link</Link>
        </Button>
      </AuthShell>
    );
  }

  if (state === "done") {
    return (
      <AuthShell icon={CheckCircle2} title="Password updated" description="Your password has been changed successfully.">
        <div className="space-y-4 text-center animate-in fade-in zoom-in-95">
          <p className="text-sm text-muted-foreground">Taking you to the community in a moment...</p>
          <Button asChild className="w-full font-bold">
            <Link href="/posts">Continue</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell icon={LockKeyhole} title="Choose a new password" description="Pick a strong password you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthError message={error} />
        <AuthField id="password" label="New password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            placeholder="At least 8 characters"
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
          />
          <PasswordStrength value={password} />
        </AuthField>
        <AuthField id="confirmPassword" label="Confirm new password" error={errors.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            {...register("confirmPassword")}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
        </AuthField>
        <Button type="submit" className="w-full font-bold" disabled={loading}>
          {loading ? (
            <>
              <Spinner /> Updating password...
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
