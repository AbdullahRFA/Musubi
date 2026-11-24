"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, MapPin, Phone, MessageSquare, Check, ArrowRight, HelpCircle, BookOpen } from "lucide-react";
import { useSession } from "@/lib/services/authService";
import { updateProfile } from "@/lib/services/profileService";
import {
  POPULAR_NEIGHBORHOODS,
  SUGGESTED_SKILLS,
  SUGGESTED_SERVICES,
  detectGeneration, MIN_AGE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { MIN_BIO_LENGTH } from "@/lib/profileCompletion";
import { AuthGuard } from "@/components/common/AuthGuard";
import { TagPicker, AgeGroupBadge } from "@/components/profile/TagPicker";

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Age state
  const [age, setAge] = useState<number | "">(session?.age ?? 65);
  const [bio, setBio] = useState(session?.bio ?? "");

  // 2. Neighborhoods state (up to 5, tag pills)
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    session?.neighborhoods && session.neighborhoods.length > 0
      ? session.neighborhoods
      : session?.location
      ? [session.location]
      : ["Hamamachi, Nagasaki"]
  );

  // 3. Contact method
  const [contactMethod, setContactMethod] = useState<"chat" | "phone">(
    session?.contactMethod ?? "chat"
  );

  // 4. Skills provided (up to 10, tag pills with auto-suggestion)
  const [skills, setSkills] = useState<string[]>(
    session?.skills && session.skills.length > 0
      ? session.skills
      : ["Traditional Cooking"]
  );

  // 5. Services needed (up to 10, tag pills with auto-suggestion)
  const [servicesNeeded, setServicesNeeded] = useState<string[]>(
    session?.servicesNeeded && session.servicesNeeded.length > 0
      ? session.servicesNeeded
      : ["Smartphone Guidance"]
  );

  // Sync session defaults when loaded
  useEffect(() => {
    if (session) {
      if (session.age) setAge(session.age);
      if (session.neighborhoods && session.neighborhoods.length > 0) {
        setNeighborhoods(session.neighborhoods);
      } else if (session.location) {
        setNeighborhoods([session.location]);
      }
      if (session.skills && session.skills.length > 0) {
        setSkills(session.skills);
      }
      if (session.servicesNeeded && session.servicesNeeded.length > 0) {
        setServicesNeeded(session.servicesNeeded);
      }
      if (session.bio) setBio(session.bio);
      if (session.contactMethod) {
        setContactMethod(session.contactMethod);
      }
    }
  }, [session]);

  // Automatic generation detection based on age rule (60+ older, <60 younger)
  const detectedGroup = useMemo(() => {
    const num = Number(age);
    if (!num || num < MIN_AGE || num > 120) return null;
    return detectGeneration(num);
  }, [age]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (neighborhoods.length === 0) {
      setError("Please select at least one neighborhood.");
      return;
    }

    setLoading(true);
    try {
      const numericAge = typeof age === "number" ? age : Number(age) || null;
      await updateProfile({
        age: numericAge,
        bio: bio.trim(),
        neighborhoods,
        location: neighborhoods[0] || "",
        contactMethod,
        skills,
        servicesOffered: skills,
        servicesNeeded,
      });
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Simple completion meter to encourage filling every section
  const completion = useMemo(() => {
    const parts = [Boolean(detectedGroup), bio.trim().length >= MIN_BIO_LENGTH, neighborhoods.length > 0, Boolean(contactMethod), skills.length > 0, servicesNeeded.length > 0];
    return Math.round((parts.filter(Boolean).length / parts.length) * 100);
  }, [detectedGroup, bio, neighborhoods, contactMethod, skills, servicesNeeded]);

  const contactOptions = [
    {
      value: "chat" as const,
      icon: MessageSquare,
      title: "In-App Chat (Recommended)",
      body: "Chat securely within Musubi after requests are accepted.",
    },
    {
      value: "phone" as const,
      icon: Phone,
      title: "Phone Calls",
      body: "Shared only with consented partners on accepted requests.",
    },
  ];

  return (
    <AuthGuard>
      <div className="page-container py-6 sm:py-12">
        <div className="mx-auto w-full max-w-3xl overflow-clip rounded-3xl border-2 border-border bg-card shadow-lift">
          {/* Header */}
          <header className="relative overflow-hidden text-center px-5 pt-8 pb-6 sm:px-10 sm:pt-10 bg-gradient-to-b from-[#E7EEE4]/70 to-transparent border-b border-border/60">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow mb-4 animate-float">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="relative text-2xl sm:text-3xl font-black text-foreground tracking-tight animate-fade-up">
              Welcome, {session?.fullName || "Neighbor"}!
            </h1>
            <p className="relative mt-2 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto animate-fade-up [animation-delay:100ms]">
              Set up your preferences so neighbors in your area can connect with you. You can adjust these anytime.
            </p>

            {/* Progress */}
            <div className="relative mt-6 mx-auto max-w-sm space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Profile completeness</span>
                <span className="tabular-nums text-primary">{completion}%</span>
              </div>
              <div
                className="h-2 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[#c2410c] transition-[width] duration-500 ease-smooth"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="divide-y divide-border/70">
              {error && (
                <div className="px-5 sm:px-10 pt-6">
                  <div
                    role="alert"
                    className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1"
                  >
                    {error}
                  </div>
                </div>
              )}

              {/* 1. Age */}
              <section className="px-5 py-6 sm:px-10 sm:py-8 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <label htmlFor="onboarding-age" className="text-sm sm:text-base font-bold text-foreground">
                    Your Age
                  </label>
                  <span className="text-xs text-muted-foreground">Automatically determines your age group</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    id="onboarding-age"
                    type="number"
                    inputMode="numeric"
                    min={MIN_AGE}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 68 or 24"
                    className="sm:w-44"
                  />
                  <AgeGroupBadge group={detectedGroup} />
                </div>
              </section>

              {/* 1b. Short bio (required to create posts) */}
              <section className="px-5 py-6 sm:px-10 sm:py-8 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <label htmlFor="onboarding-bio" className="text-sm sm:text-base font-bold text-foreground">
                    A little about you
                  </label>
                  <span
                    className={`text-xs tabular-nums ${
                      bio.trim().length >= MIN_BIO_LENGTH ? "text-success font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {bio.trim().length}/{MIN_BIO_LENGTH}+ characters
                  </span>
                </div>
                <Textarea
                  id="onboarding-bio"
                  rows={3}
                  maxLength={400}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Retired teacher who loves gardening and would like help with my smartphone."
                />
                <p className="text-xs text-muted-foreground">
                  Neighbours read this before responding. You need at least {MIN_BIO_LENGTH} characters to create posts.
                </p>
              </section>

              {/* 2. Neighbourhoods */}
              <section className="px-5 py-6 sm:px-10 sm:py-8">
                <TagPicker
                  label="Your Neighborhood"
                  description="Select up to 5 neighborhoods you belong to or are close to*"
                  icon={MapPin}
                  values={neighborhoods}
                  onChange={(next) => {
                    setNeighborhoods(next);
                    setError(null);
                  }}
                  suggestions={POPULAR_NEIGHBORHOODS}
                  max={5}
                  onLimit={setError}
                  placeholder="Search neighborhood (e.g. Urakami, Peace Park)..."
                  quickPickLabel="Quick pick:"
                  emptyText="No neighborhoods selected yet. Add at least one below."
                  suggestionIcon={MapPin}
                  formatQuickPick={(p) => p.split(",")[0]}
                />
              </section>

              {/* 3. Contact method */}
              <section className="px-5 py-6 sm:px-10 sm:py-8 space-y-3">
                <h2 id="contact-label" className="text-sm sm:text-base font-bold text-foreground">
                  Preferred Contact Method
                </h2>
                <div role="radiogroup" aria-labelledby="contact-label" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contactOptions.map(({ value, icon: OptIcon, title, body }) => {
                    const selected = contactMethod === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setContactMethod(value)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selected
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/60"
                        }`}
                      >
                        <span
                          className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                          aria-hidden="true"
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground pr-7">
                          <OptIcon className="h-4 w-4 text-primary shrink-0" />
                          <span>{title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4. Skills */}
              <section className="px-5 py-6 sm:px-10 sm:py-8">
                <TagPicker
                  label="Services provided"
                  description="Add up to 10 services or skills you can share*"
                  icon={BookOpen}
                  values={skills}
                  onChange={setSkills}
                  suggestions={SUGGESTED_SKILLS}
                  max={10}
                  onLimit={setError}
                  placeholder="Search a skill (e.g. Traditional Cooking, Origami)..."
                  addLabel="Add Skill"
                  emptyText="No skills added yet. Add one below."
                />
              </section>

              {/* 5. Services needed */}
              <section className="px-5 py-6 sm:px-10 sm:py-8">
                <TagPicker
                  label="Services needed"
                  description="Add up to 10 services or areas you would appreciate help with*"
                  icon={HelpCircle}
                  iconClassName="text-secondary"
                  values={servicesNeeded}
                  onChange={setServicesNeeded}
                  suggestions={SUGGESTED_SERVICES}
                  max={10}
                  onLimit={setError}
                  placeholder="Search a need (e.g. Smartphone Assistance)..."
                  addLabel="Add Need"
                  emptyText="No services listed yet. Add one below."
                />
              </section>
            </div>

            {/* Actions: sticky on mobile so the primary button is always reachable */}
            <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-5 py-4 sm:px-10 sm:py-5 border-t border-border bg-card/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                Skip setup for now
              </button>

              <Button type="submit" disabled={loading} className="group w-full sm:w-auto font-bold px-8">
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Complete Setup & Go to Community
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
