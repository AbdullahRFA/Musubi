"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  AlertCircle,
  MapPin,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";
import { registerSchema, type RegisterValues } from "@/lib/validators";
import { signUp } from "@/lib/services/authService";
import { POPULAR_NEIGHBORHOODS, detectGeneration } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Neighborhood search and auto-suggestion state
  const [neighborhoodInput, setNeighborhoodInput] = useState("");
  const [isNeighborhoodOpen, setIsNeighborhoodOpen] = useState(false);

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
      age: undefined as any,
      neighborhood: "",
    },
  });

  const watchedAge = watch("age");
  const watchedNeighborhood = watch("neighborhood");

  // Dynamic automatic age group detection
  const detectedGroup = useMemo(() => {
    const numericAge = Number(watchedAge);
    if (!numericAge || numericAge < 13 || numericAge > 120) return null;
    return detectGeneration(numericAge);
  }, [watchedAge]);

  // Dynamic neighborhood search suggestions
  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoodInput.trim()) return POPULAR_NEIGHBORHOODS.slice(0, 6);
    const q = neighborhoodInput.toLowerCase().trim();
    return POPULAR_NEIGHBORHOODS.filter((place) =>
      place.toLowerCase().includes(q)
    );
  }, [neighborhoodInput]);

  const selectNeighborhood = (name: string) => {
    setValue("neighborhood", name, { shouldValidate: true });
    setNeighborhoodInput(name);
    setIsNeighborhoodOpen(false);
  };

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        age: values.age,
        neighborhood: values.neighborhood,
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

            {/* Dynamic Neighborhood Search */}
            <div className="space-y-1.5 pt-1 relative">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Your Neighborhood</span>
                <span className="text-muted-foreground font-normal text-[11px]">(Optional — choose or search)</span>
              </label>

              <div className="relative">
                <Input
                  value={neighborhoodInput}
                  onChange={(e) => {
                    setNeighborhoodInput(e.target.value);
                    setValue("neighborhood", e.target.value);
                    setIsNeighborhoodOpen(true);
                  }}
                  onFocus={() => setIsNeighborhoodOpen(true)}
                  onBlur={() => setTimeout(() => setIsNeighborhoodOpen(false), 250)}
                  placeholder="Type to search e.g. Hamamachi, Peace Park, Dejima..."
                  className="h-10 text-sm pl-9 pr-4"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Suggestions Dropdown */}
              {isNeighborhoodOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border-2 border-border bg-white p-1.5 shadow-2xl">
                  {filteredNeighborhoods.length > 0 ? (
                    filteredNeighborhoods.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectNeighborhood(name);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs rounded-lg font-medium transition-colors hover:bg-primary/10 ${
                          watchedNeighborhood === name
                            ? "bg-primary/15 text-primary font-bold"
                            : "text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>{name}</span>
                        </span>
                        {watchedNeighborhood === name && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No matching predefined places. Custom neighborhood &quot;{neighborhoodInput}&quot; will be used.
                    </div>
                  )}
                  {neighborhoodInput.trim() && !filteredNeighborhoods.includes(neighborhoodInput.trim()) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectNeighborhood(neighborhoodInput.trim());
                      }}
                      className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10 rounded-md mt-1"
                    >
                      <span>Use custom: &quot;{neighborhoodInput.trim()}&quot;</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_NEIGHBORHOODS.slice(0, 4).map((place) => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => selectNeighborhood(place)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      watchedNeighborhood === place
                        ? "bg-primary text-white border-primary font-bold"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {place.split(",")[0]}
                  </button>
                ))}
              </div>
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
