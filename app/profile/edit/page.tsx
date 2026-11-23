"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Plus,
  X,
  AlertCircle,
  Save,
  MapPin,
  HeartHandshake,
  Search,
} from "lucide-react";
import { profileSchema, type ProfileValues } from "@/lib/validators";
import { useSession } from "@/lib/services/authService";
import { updateProfile } from "@/lib/services/profileService";
import {
  POPULAR_NEIGHBORHOODS,
  SUGGESTED_SKILLS,
  SUGGESTED_SERVICES,
  detectGeneration,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function EditProfilePage() {
  const router = useRouter();
  const session = useSession();

  // Age state & detection
  const [age, setAge] = useState<number | "">("");

  // Neighborhoods state (up to 5)
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [neighborhoodQuery, setNeighborhoodQuery] = useState("");
  const [isNeighborhoodOpen, setIsNeighborhoodOpen] = useState(false);

  // Skills & Needs states
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  const [servicesNeeded, setServicesNeeded] = useState<string[]>([]);
  const [needQuery, setNeedQuery] = useState("");
  const [isNeedOpen, setIsNeedOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (session) {
      reset({
        fullName: session.fullName,
        email: session.email,
        bio: session.bio,
        location: session.location,
        availability: session.availability || "Flexible",
        contactMethod: session.contactMethod,
        phone: session.phone ?? "",
        interests: session.interests,
        skills: session.skills,
        servicesOffered: session.servicesOffered,
        servicesNeeded: session.servicesNeeded,
      });

      if (session.age) setAge(session.age);
      if (session.neighborhoods && session.neighborhoods.length > 0) {
        setNeighborhoods(session.neighborhoods);
      } else if (session.location) {
        setNeighborhoods([session.location]);
      }
      setSkills(session.skills || []);
      setServicesNeeded(session.servicesNeeded || []);
    }
  }, [session, reset]);

  const contactMethod = watch("contactMethod");

  // Automatic Generation Detection
  const detectedGroup = useMemo(() => {
    const num = Number(age);
    if (!num || num < 13 || num > 120) return null;
    return detectGeneration(num);
  }, [age]);

  // Neighborhoods auto-suggestions
  const filteredNeighborhoods = useMemo(() => {
    const q = neighborhoodQuery.trim().toLowerCase();
    const available = POPULAR_NEIGHBORHOODS.filter((p) => !neighborhoods.includes(p));
    if (!q) return available.slice(0, 6);
    return available.filter((p) => p.toLowerCase().includes(q));
  }, [neighborhoodQuery, neighborhoods]);

  const addNeighborhood = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (neighborhoods.length >= 5) {
      setError("You can select up to 5 neighborhoods.");
      return;
    }
    if (!neighborhoods.includes(trimmed)) {
      setNeighborhoods([...neighborhoods, trimmed]);
      setNeighborhoodQuery("");
      setIsNeighborhoodOpen(false);
    }
  };

  const removeNeighborhood = (name: string) => {
    setNeighborhoods(neighborhoods.filter((n) => n !== name));
  };

  // Skills auto-suggestions
  const filteredSkills = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    const available = SUGGESTED_SKILLS.filter((s) => !skills.includes(s));
    if (!q) return available.slice(0, 6);
    return available.filter((s) => s.toLowerCase().includes(q));
  }, [skillQuery, skills]);

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.length >= 10) {
      setError("You can add up to 10 skills.");
      return;
    }
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillQuery("");
      setIsSkillOpen(false);
    }
  };

  const removeSkill = (tag: string) => {
    setSkills(skills.filter((s) => s !== tag));
  };

  // Needs auto-suggestions
  const filteredNeeds = useMemo(() => {
    const q = needQuery.trim().toLowerCase();
    const available = SUGGESTED_SERVICES.filter((n) => !servicesNeeded.includes(n));
    if (!q) return available.slice(0, 6);
    return available.filter((n) => n.toLowerCase().includes(q));
  }, [needQuery, servicesNeeded]);

  const addNeed = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (servicesNeeded.length >= 10) {
      setError("You can add up to 10 services needed.");
      return;
    }
    if (!servicesNeeded.includes(trimmed)) {
      setServicesNeeded([...servicesNeeded, trimmed]);
      setNeedQuery("");
      setIsNeedOpen(false);
    }
  };

  const removeNeed = (tag: string) => {
    setServicesNeeded(servicesNeeded.filter((n) => n !== tag));
  };

  const onSubmit = async (values: ProfileValues) => {
    setError(null);
    if (neighborhoods.length === 0) {
      setError("Please add at least one neighborhood.");
      return;
    }

    setSaving(true);
    try {
      const numericAge = typeof age === "number" ? age : Number(age) || null;
      await updateProfile({
        fullName: values.fullName,
        email: values.email,
        age: numericAge,
        neighborhoods,
        location: neighborhoods[0] || values.location,
        bio: values.bio,
        availability: values.availability || "Flexible",
        contactMethod: values.contactMethod,
        phone: values.contactMethod === "phone" ? values.phone : null,
        skills,
        servicesOffered: skills,
        servicesNeeded,
      });
      router.push(`/profile/${session?.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Card className="border-2 border-border bg-card shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border pb-6 space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">Edit Your Profile</CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              Update your biography, age, neighborhoods, and skills
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm sm:text-base font-bold text-foreground">Full Name</label>
                <Input {...register("fullName")} aria-invalid={Boolean(errors.fullName)} className="h-10 text-sm" />
                {errors.fullName && (
                  <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* Age Input with Live Auto-Detection (60+ older, <60 younger) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-foreground">Your Age</label>
                  <span className="text-xs text-muted-foreground">Automatically sets age group</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Enter your age"
                    className="h-10 text-sm sm:w-48"
                  />
                  {detectedGroup && (
                    <div
                      className={`flex-1 flex items-center justify-between p-2 px-3 rounded-lg border text-xs sm:text-sm font-semibold ${
                        detectedGroup.userGroup === "og"
                          ? "bg-[#315B4B]/10 border-[#315B4B]/30 text-[#315B4B]"
                          : "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <HeartHandshake className="h-4 w-4 shrink-0" />
                        <span>Detected Group: <strong>{detectedGroup.label}</strong></span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                        {detectedGroup.userGroup === "og" ? "O.G." : "Y.G."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-sm sm:text-base font-bold text-foreground">Short Biography</label>
                <Textarea
                  rows={3}
                  placeholder="Tell neighbors a little about your life, what you enjoy doing, and what you'd like to share..."
                  {...register("bio")}
                  aria-invalid={Boolean(errors.bio)}
                />
                {errors.bio && (
                  <p className="text-xs text-destructive font-medium">{errors.bio.message}</p>
                )}
              </div>

              {/* Neighborhoods (Up to 5 with pills matching user's screenshot) */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <div>
                  <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Your Neighborhoods (up to 5)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select neighborhoods you live in or frequently connect with
                  </p>
                </div>

                {/* Pill list */}
                <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
                  {neighborhoods.map((place) => (
                    <span
                      key={place}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-2xs"
                    >
                      <span>{place}</span>
                      <button
                        type="button"
                        onClick={() => removeNeighborhood(place)}
                        className="rounded-full hover:bg-black/20 p-0.5 transition-colors"
                        aria-label={`Remove ${place}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Neighborhood Input */}
                {neighborhoods.length < 5 && (
                  <div className="relative pt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={neighborhoodQuery}
                          onChange={(e) => {
                            setNeighborhoodQuery(e.target.value);
                            setIsNeighborhoodOpen(true);
                          }}
                          onFocus={() => setIsNeighborhoodOpen(true)}
                          onBlur={() => setTimeout(() => setIsNeighborhoodOpen(false), 250)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNeighborhood(neighborhoodQuery);
                            }
                          }}
                          placeholder="Search or type a neighborhood..."
                          className="h-10 text-xs sm:text-sm pl-9"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addNeighborhood(neighborhoodQuery)}
                        disabled={!neighborhoodQuery.trim()}
                        className="h-10 text-xs sm:text-sm font-bold shrink-0 gap-1 rounded-full border-primary text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>

                    {isNeighborhoodOpen && filteredNeighborhoods.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border-2 border-border bg-white p-1.5 shadow-2xl">
                        {filteredNeighborhoods.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addNeighborhood(name);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm rounded-lg font-medium hover:bg-primary/10 text-foreground transition-colors"
                          >
                            <span>{name}</span>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <label className="text-sm sm:text-base font-bold text-foreground">Preferred Contact Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "chat")}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-sm transition-all ${
                      contactMethod === "chat"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    In-App Chat Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "phone")}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-sm transition-all ${
                      contactMethod === "phone"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    Allow Phone Contact
                  </button>
                </div>

                {contactMethod === "phone" && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs sm:text-sm font-bold text-foreground">
                      Phone Number (Shared only on accepted exchanges)
                    </label>
                    <Input
                      placeholder="e.g. 095-822-1004"
                      {...register("phone")}
                      aria-invalid={Boolean(errors.phone)}
                      className="h-10 text-sm"
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tag Input: Skills & Expertise (Pills with ✕ matching screenshot) */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <label className="text-sm sm:text-base font-bold text-foreground">Skills provided</label>
                <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-2xs"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="rounded-full hover:bg-black/20 p-0.5 transition-colors"
                        aria-label={`Remove ${s}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {skills.length < 10 && (
                  <div className="relative pt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={skillQuery}
                          onChange={(e) => {
                            setSkillQuery(e.target.value);
                            setIsSkillOpen(true);
                          }}
                          onFocus={() => setIsSkillOpen(true)}
                          onBlur={() => setTimeout(() => setIsSkillOpen(false), 250)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill(skillQuery);
                            }
                          }}
                          placeholder="Type or search a skill..."
                          className="h-10 text-xs sm:text-sm pl-9"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addSkill(skillQuery)}
                        disabled={!skillQuery.trim()}
                        className="h-10 text-xs sm:text-sm font-bold shrink-0 gap-1 rounded-full border-primary text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>

                    {isSkillOpen && filteredSkills.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border-2 border-border bg-white p-1.5 shadow-2xl">
                        {filteredSkills.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addSkill(name);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm rounded-lg font-medium hover:bg-primary/10 text-foreground transition-colors"
                          >
                            <span>{name}</span>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tag Input: Services Needed (Pills with ✕ matching screenshot) */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <label className="text-sm sm:text-base font-bold text-foreground">Services needed</label>
                <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
                  {servicesNeeded.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-2xs"
                    >
                      <span>{n}</span>
                      <button
                        type="button"
                        onClick={() => removeNeed(n)}
                        className="rounded-full hover:bg-black/20 p-0.5 transition-colors"
                        aria-label={`Remove ${n}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {servicesNeeded.length < 10 && (
                  <div className="relative pt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={needQuery}
                          onChange={(e) => {
                            setNeedQuery(e.target.value);
                            setIsNeedOpen(true);
                          }}
                          onFocus={() => setIsNeedOpen(true)}
                          onBlur={() => setTimeout(() => setIsNeedOpen(false), 250)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNeed(needQuery);
                            }
                          }}
                          placeholder="Type or search a needed service..."
                          className="h-10 text-xs sm:text-sm pl-9"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addNeed(needQuery)}
                        disabled={!needQuery.trim()}
                        className="h-10 text-xs sm:text-sm font-bold shrink-0 gap-1 rounded-full border-primary text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>

                    {isNeedOpen && filteredNeeds.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border-2 border-border bg-white p-1.5 shadow-2xl">
                        {filteredNeeds.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addNeed(name);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm rounded-lg font-medium hover:bg-primary/10 text-foreground transition-colors"
                          >
                            <span>{name}</span>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-4 flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="font-bold gap-2 bg-primary text-white hover:bg-[#234336]" disabled={saving}>
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Profile"}</span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
