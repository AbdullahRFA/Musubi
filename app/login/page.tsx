"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Sparkles, AlertCircle } from "lucide-react";
import { loginSchema, type LoginValues } from "@/lib/validators";
import { signIn } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (email: string) => {
    setValue("email", email);
    setValue("password", "password123");
    signIn(email, "password123").then(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-2 border-border bg-card">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-base">
            Log in to your Tsunagu Generations account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-base font-semibold text-foreground">Email address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-base font-semibold text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                In this demo MVP, any password with 4+ characters is accepted.
              </p>
            </div>

            {/* Quick Demo Pre-fills */}
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">
                Quick Demo Accounts (1-Click)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickDemoLogin("kenji.sato@example.com")}
                  className="text-xs h-auto py-2 font-medium justify-start"
                >
                  <span className="truncate">Kenji (O.G.)</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickDemoLogin("maya.tanaka@example.com")}
                  className="text-xs h-auto py-2 font-medium justify-start"
                >
                  <span className="truncate">Maya (Y.G.)</span>
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full text-base font-bold" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
