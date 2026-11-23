"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, ArrowRight, HeartHandshake } from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validators";
import { signUp, signInWithGoogle } from "@/lib/services/authService";
import { detectGeneration } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthError, AuthField, GoogleAuthButton, PasswordInput, Spinner } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      age: undefined as any,
    },
  });

  const watchedAge = watch("age");

  // Dynamic automatic age group detection
  const detectedGroup = useMemo(() => {
    const numericAge = Number(watchedAge);
    if (!numericAge || numericAge < 13 || numericAge > 120) return null;
    return detectGeneration(numericAge);
  }, [watchedAge]);

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        age: values.age,
      });
      // Redirect directly to onboarding page per requirements
      router.push("/onboarding");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthShell
      icon={UserPlus}
      title="Join Tsunagu Generations"
      description="Connect across generations through skills, care, and mutual community exchange."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4">
            Log in here
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
          dividerLabel="Or register with email"
        />

        <AuthField id="fullName" label="Full Name" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Kenji Sato"
            {...register("fullName")}
            aria-invalid={Boolean(errors.fullName)}
          />
        </AuthField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField id="email" label="Email Address" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
          </AuthField>

          <AuthField id="password" label="Password" required error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="At least 4 characters"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
            />
          </AuthField>
        </div>

        <AuthField
          id="age"
          label="Your Age"
          required
          hint="Used only to detect your age group"
          error={errors.age?.message}
        >
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={13}
            max={120}
            placeholder="e.g. 68 or 24"
            {...register("age")}
            aria-invalid={Boolean(errors.age)}
          />

          {detectedGroup ? (
            <div
              className={`mt-2 flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border text-sm animate-in fade-in zoom-in-95 ${
                detectedGroup.userGroup === "og"
                  ? "bg-[#315B4B]/10 border-[#315B4B]/30 text-[#315B4B]"
                  : "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]"
              }`}
            >
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 shrink-0" />
                <span>
                  <span className="font-bold">Detected Age Group: </span>
                  <span className="font-extrabold">{detectedGroup.label}</span>
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                Auto-set
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enter your age (60+ is automatically Older Generation, under 60 is Younger Generation).
            </p>
          )}
        </AuthField>

        <Button type="submit" disabled={busy} className="group w-full font-bold">
          {loading ? (
            <>
              <Spinner /> Saving & Proceeding...
            </>
          ) : (
            <>
              Continue Profile Setup
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
