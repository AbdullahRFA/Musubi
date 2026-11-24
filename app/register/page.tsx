"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, ArrowRight, HeartHandshake, MailCheck } from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validators";
import { signUp, signInWithGoogle, useSession } from "@/lib/services/authService";
import { detectGeneration, MIN_AGE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthShell,
  AuthError,
  AuthField,
  GoogleAuthButton,
  PasswordInput,
  PasswordStrength,
  Spinner,
} from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  // Already signed in? Nothing to register — go to the community.
  useEffect(() => {
    if (session && !loading && !confirmEmail) router.replace("/posts");
  }, [session, loading, confirmEmail, router]);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Failed to sign up with Google.");
      setGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", age: undefined as unknown as number },
  });

  const password = watch("password") ?? "";
  const watchedAge = watch("age");

  // Live age-group preview (60+ Older Generation, under 60 Younger Generation)
  const detectedGroup = useMemo(() => {
    const n = Number(watchedAge);
    if (!Number.isInteger(n) || n < MIN_AGE || n > 120) return null;
    return detectGeneration(n);
  }, [watchedAge]);

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        age: values.age,
      });
      if (needsEmailConfirmation) {
        setConfirmEmail(values.email.trim().toLowerCase());
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err?.message || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;
  const describedBy = (id: string, hasError: boolean, extra?: string) =>
    [hasError ? `${id}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  /* ---------- Email confirmation required ---------- */
  if (confirmEmail) {
    return (
      <AuthShell
        icon={MailCheck}
        title="Check your email"
        description="One last step to finish creating your account."
        footer={
          <>
            Already confirmed?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4">
              Log in
            </Link>
          </>
        }
      >
        <div className="space-y-3 text-center text-sm text-foreground animate-in fade-in zoom-in-95">
          <p>
            We sent a confirmation link to <strong className="break-all">{confirmEmail}</strong>.
          </p>
          <p className="text-muted-foreground">
            Open it on this device, then log in to finish setting up your profile. Can&apos;t find it? Check your spam
            folder.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={UserPlus}
      title="Create your account"
      description="Free to join. It takes about two minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthError message={error} />

        <GoogleAuthButton
          onClick={handleGoogleSignUp}
          loading={googleLoading}
          disabled={busy}
          label="Sign up with Google"
          dividerLabel="Or with email"
        />

        <AuthField id="fullName" label="Full name" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Kenji Sato"
            maxLength={80}
            aria-required="true"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy("fullName", Boolean(errors.fullName))}
            {...register("fullName")}
          />
        </AuthField>

        <AuthField id="email" label="Email address" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            maxLength={254}
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", Boolean(errors.email))}
            {...register("email")}
          />
        </AuthField>

        <AuthField id="password" label="Password" required error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters, with a letter and a number"
            maxLength={72}
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password", Boolean(errors.password))}
            {...register("password")}
          />
          {password && <PasswordStrength value={password} />}
        </AuthField>

        <AuthField id="age" label="Age" required error={errors.age?.message}>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={120}
            step={1}
            placeholder="e.g. 68"
            aria-required="true"
            aria-invalid={Boolean(errors.age)}
            aria-describedby={describedBy("age", Boolean(errors.age), "age-help")}
            {...register("age")}
          />
          {detectedGroup ? (
            <p
              id="age-help"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm animate-in fade-in ${
                detectedGroup.userGroup === "og"
                  ? "border-[#315B4B]/30 bg-[#315B4B]/10 text-[#315B4B]"
                  : "border-[#2563EB]/30 bg-[#2563EB]/10 text-[#1D4ED8]"
              }`}
            >
              <HeartHandshake className="h-4 w-4 shrink-0" />
              You&apos;ll join as <strong className="font-extrabold">{detectedGroup.label}</strong>
            </p>
          ) : (
            <p id="age-help" className="text-xs text-muted-foreground">
              You must be {MIN_AGE} or older to join. Your age only sets your generation: 60 and over is Older
              Generation, under 60 is Younger Generation.
            </p>
          )}
        </AuthField>

        <Button type="submit" disabled={busy} className="group w-full font-bold">
          {loading ? (
            <>
              <Spinner /> Creating your account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
