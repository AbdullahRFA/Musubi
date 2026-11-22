"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, AlertCircle, Users, Smile } from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validators";
import { signUp } from "@/lib/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultGroup = searchParams.get("group") === "og" ? "og" : searchParams.get("group") === "yg" ? "yg" : "og";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      userGroup: defaultGroup,
    },
  });

  const selectedGroup = watch("userGroup");

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      await signUp(values);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-md border-2 border-border bg-card">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Join Tsunagu Generations</CardTitle>
        <CardDescription className="text-base">
          Connect, teach, learn, and assist across generations
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Group Selection */}
          <div className="space-y-2">
            <label className="text-base font-bold text-foreground">
              Choose your generation group <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("userGroup", "og")}
                className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all ${
                  selectedGroup === "og"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1">
                  <Users className="h-5 w-5" />
                  <span>Older Generation</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  (O.G.) Share wisdom, traditional skills, or request simple day-to-day assistance.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue("userGroup", "yg")}
                className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all ${
                  selectedGroup === "yg"
                    ? "border-secondary bg-secondary/10 shadow-sm"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 text-secondary font-bold text-lg mb-1">
                  <Smile className="h-5 w-5" />
                  <span>Younger Generation</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  (Y.G.) Offer practical help, tech guidance, learn traditional arts, or seek advice.
                </span>
              </button>
            </div>
            {errors.userGroup && (
              <p className="text-xs text-destructive font-medium">{errors.userGroup.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-foreground">Full Name</label>
            <Input
              type="text"
              placeholder="e.g. Kenji Sato or Maya Tanaka"
              {...register("fullName")}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-base font-semibold text-foreground">Password</label>
            <Input
              type="password"
              placeholder="At least 4 characters"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button type="submit" className="w-full text-base font-bold" disabled={loading}>
            {loading ? "Creating account..." : "Continue to profile setup"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
