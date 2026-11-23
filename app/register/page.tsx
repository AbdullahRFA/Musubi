"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  AlertCircle,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validators";
import { signUp, signInWithGoogle } from "@/lib/services/authService";
import { detectGeneration } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GoogleIcon } from "@/components/common/GoogleIcon";

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

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-lg shadow-md border-2 border-border bg-card rounded-2xl">
        <CardHeader className="space-y-2 text-center pb-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">
            Join Tsunagu Generations
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
            Connect across generations through skills, care, and mutual community exchange.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-1">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-in */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-11 text-sm font-semibold border-2 border-border hover:bg-muted"
            >
              <GoogleIcon />
              <span>{googleLoading ? "Connecting to Google..." : "Sign up with Google"}</span>
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Kenji Sato"
                {...register("fullName")}
                className="h-10 text-sm"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive font-medium">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="h-10 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="At least 4 characters"
                {...register("password")}
                className="h-10 text-sm"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Age Input with Auto-Detected Generation */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Your Age <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Used only to automatically detect your age group
                </span>
              </div>
              <Input
                type="number"
                min={13}
                max={120}
                placeholder="e.g. 68 or 24"
                {...register("age")}
                className="h-10 text-sm"
              />
              {errors.age && (
                <p className="text-xs text-destructive font-medium">
                  {errors.age.message}
                </p>
              )}

              {/* Automatic Age Group Detection Feedback */}
              {detectedGroup ? (
                <div
                  className={`mt-2 flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                    detectedGroup.userGroup === "og"
                      ? "bg-[#315B4B]/10 border-[#315B4B]/30 text-[#315B4B]"
                      : "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-bold">Detected Age Group: </span>
                      <span className="font-extrabold">{detectedGroup.label}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                    Auto-set
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Enter your age (60+ is automatically Older Generation, under 60 is Younger Generation).
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold text-sm h-11 bg-primary hover:bg-[#234336] text-white shadow-xs gap-2 flex items-center justify-center"
            >
              <span>{loading ? "Saving & Proceeding..." : "Continue Profile Setup"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
