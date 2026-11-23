"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Sparkles } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/validators";
import { signIn, signInWithGoogle } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthError, AuthField, GoogleAuthButton, PasswordInput, Spinner } from "@/components/auth/AuthShell";

const DEMO_ACCOUNTS = [
  { email: "haruko.sato@tsunagu.demo", label: "Haruko (Origami)", emoji: "🌸" },
  { email: "maya.tanaka@tsunagu.demo", label: "Maya (Smartphone)", emoji: "📱" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with Google.");
      setGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (email: string) => {
    setError(null);
    setDemoLoading(email);
    setValue("email", email);
    setValue("password", "password123");
    try {
      await signIn(email, "password123");
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Demo sign-in failed. Please try again.");
      setDemoLoading(null);
    }
  };

  const busy = loading || googleLoading || demoLoading !== null;

  return (
    <AuthShell
      icon={LogIn}
      title="Welcome back"
      description="Log in to your Tsunagu Generations account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline underline-offset-4">
            Register here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthError message={error} />

        <GoogleAuthButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={busy}
          label="Continue with Google"
          dividerLabel="Or continue with email"
        />

        <AuthField id="email" label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
          hint={
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline underline-offset-4">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <p className="text-xs text-muted-foreground">In this demo MVP, any password with 4+ characters is accepted.</p>
        </AuthField>

        <Button type="submit" className="w-full font-bold" disabled={busy}>
          {loading ? (
            <>
              <Spinner /> Signing in...
            </>
          ) : (
            "Log in"
          )}
        </Button>

        {/* Quick demo accounts */}
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3 sm:p-4 space-y-2.5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Quick Demo Accounts (1-Click)
          </span>
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <Button
                key={acct.email}
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => quickDemoLogin(acct.email)}
                className="justify-start font-medium hover:-translate-y-0.5"
              >
                {demoLoading === acct.email ? <Spinner /> : <span className="text-base">{acct.emoji}</span>}
                <span className="truncate">{acct.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Loading sign in...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
