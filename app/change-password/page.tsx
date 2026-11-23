"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Info, LockKeyhole, ShieldCheck } from "lucide-react";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validators";
import { accountHasPassword, changePassword, useSession } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";
import { AuthError, AuthField, PasswordInput, PasswordStrength, Spinner } from "@/components/auth/AuthShell";

export default function ChangePasswordPage() {
  const router = useRouter();
  const session = useSession();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  const password = watch("password");

  useEffect(() => {
    accountHasPassword().then(setHasPassword).catch(() => setHasPassword(true));
  }, []);

  const onSubmit = async (values: ChangePasswordValues) => {
    if (hasPassword && !values.currentPassword) {
      setFieldError("currentPassword", { message: "Please enter your current password." });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.password });
      reset();
      setDone(true);
    } catch (err: any) {
      const msg: string = err?.message || "Could not change your password.";
      if (msg.toLowerCase().includes("current password")) setFieldError("currentPassword", { message: msg });
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="page-container max-w-2xl py-6 sm:py-10 space-y-6">
        <div className="animate-fade-up">
          <button
            type="button"
            onClick={() => router.back()}
            className="group mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5 tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </span>
            {hasPassword === false ? "Set a password" : "Change password"}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
            Keep your account secure with a strong password you don&apos;t use anywhere else.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden animate-fade-up [animation-delay:100ms]">
          {done ? (
            <div className="p-6 sm:p-10 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Password updated</h2>
              <p className="text-sm text-muted-foreground">Use your new password the next time you log in.</p>
              <div className="flex flex-col min-[420px]:flex-row justify-center gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link href={session ? `/profile/${session.id}` : "/posts"}>Back to profile</Link>
                </Button>
                <Button asChild>
                  <Link href="/posts">Go to community</Link>
                </Button>
              </div>
            </div>
          ) : hasPassword === null ? (
            <div className="flex justify-center p-10">
              <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-5 p-5 sm:p-8">
                <AuthError message={error} />

                {hasPassword === false && (
                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    You signed up with Google. Setting a password lets you also log in with your email.
                  </div>
                )}

                {hasPassword && (
                  <AuthField
                    id="currentPassword"
                    label="Current password"
                    error={errors.currentPassword?.message}
                    hint={
                      <Link
                        href={`/forgot-password${session?.email ? `?email=${encodeURIComponent(session.email)}` : ""}`}
                        className="font-semibold text-primary hover:underline underline-offset-4"
                      >
                        Forgot it?
                      </Link>
                    }
                  >
                    <PasswordInput
                      id="currentPassword"
                      autoComplete="current-password"
                      {...register("currentPassword")}
                      aria-invalid={Boolean(errors.currentPassword)}
                    />
                  </AuthField>
                )}

                <AuthField id="password" label="New password" error={errors.password?.message}>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
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
                    {...register("confirmPassword")}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                </AuthField>
              </div>

              <div className="flex flex-col-reverse min-[420px]:flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-8">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Never share your password with anyone.
                </p>
                <Button type="submit" className="w-full min-[420px]:w-auto font-bold px-6" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner /> Saving...
                    </>
                  ) : hasPassword ? (
                    "Update password"
                  ) : (
                    "Set password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
