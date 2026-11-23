"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  MapPin,
  Phone,
  MessageSquare,
  Check,
  X,
  Plus,
  Search,
  HeartHandshake,
  ArrowRight,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { onboardingSchema } from "@/lib/validators";
import { useSession } from "@/lib/services/authService";
import { updateProfile } from "@/lib/services/profileService";
import {
  POPULAR_NEIGHBORHOODS,
  SUGGESTED_SKILLS,
  SUGGESTED_SERVICES,
  detectGeneration,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

type OnboardingValues = {
  age?: number;
  neighborhoods?: string[];
  contactMethod: "chat" | "phone";
  skills?: string[];
  servicesNeeded?: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Age state
  const [age, setAge] = useState<number | "">(session?.age ?? 65);

  // 2. Neighborhoods state (up to 5, tag pills)
  const [neighborhoods, setNeighborhoods] = useState<string[]>(
    session?.neighborhoods && session.neighborhoods.length > 0
      ? session.neighborhoods
      : session?.location
      ? [session.location]
      : ["Hamamachi, Nagasaki"]
  );
  const [neighborhoodQuery, setNeighborhoodQuery] = useState("");
  const [isNeighborhoodOpen, setIsNeighborhoodOpen] = useState(false);

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
  const [skillQuery, setSkillQuery] = useState("");
  const [isSkillOpen, setIsSkillOpen] = useState(false);

  // 5. Services needed (up to 10, tag pills with auto-suggestion)
  const [servicesNeeded, setServicesNeeded] = useState<string[]>(
    session?.servicesNeeded && session.servicesNeeded.length > 0
      ? session.servicesNeeded
      : ["Smartphone Guidance"]
  );
  const [needQuery, setNeedQuery] = useState("");
  const [isNeedOpen, setIsNeedOpen] = useState(false);

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
      if (session.contactMethod) {
        setContactMethod(session.contactMethod);
      }
    }
  }, [session]);

  // Automatic generation detection based on age rule (60+ older, <60 younger)
  const detectedGroup = useMemo(() => {
    const num = Number(age);
    if (!num || num < 13 || num > 120) return null;
    return detectGeneration(num);
  }, [age]);

  // Filtered Neighborhoods Suggestions
  const filteredNeighborhoods = useMemo(() => {
    const q = neighborhoodQuery.trim().toLowerCase();
    const available = POPULAR_NEIGHBORHOODS.filter(
      (p) => !neighborhoods.includes(p)
    );
    if (!q) return available.slice(0, 6);
    return available.filter((p) => p.toLowerCase().includes(q));
  }, [neighborhoodQuery, neighborhoods]);

  // Filtered Skill Suggestions
  const filteredSkills = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    const available = SUGGESTED_SKILLS.filter((s) => !skills.includes(s));
    if (!q) return available.slice(0, 6);
    return available.filter((s) => s.toLowerCase().includes(q));
  }, [skillQuery, skills]);

  // Filtered Service Suggestions
  const filteredNeeds = useMemo(() => {
    const q = needQuery.trim().toLowerCase();
    const available = SUGGESTED_SERVICES.filter(
      (n) => !servicesNeeded.includes(n)
    );
    if (!q) return available.slice(0, 6);
    return available.filter((n) => n.toLowerCase().includes(q));
  }, [needQuery, servicesNeeded]);

  // Neighborhood handlers (max 5)
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
      setError(null);
    }
  };

  const removeNeighborhood = (name: string) => {
    setNeighborhoods(neighborhoods.filter((n) => n !== name));
  };

  // Skill handlers (max 10)
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
      setError(null);
    }
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter((s) => s !== name));
  };

  // Service needed handlers (max 10)
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
      setError(null);
    }
  };

  const removeNeed = (name: string) => {
    setServicesNeeded(servicesNeeded.filter((n) => n !== name));
  };

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

  return (
    <AuthGuard>
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-2xl shadow-lg border-2 border-border bg-card rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6 sm:pt-8 bg-gradient-to-b from-[#E7EEE4]/50 to-transparent border-b border-border/60">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">
              Welcome, {session?.fullName || "Neighbor"}!
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Set up your preferences so neighbors in your area can connect with you. You can adjust these anytime.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6 sm:p-8">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              {/* 1. Age & Automatic Generation Detection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-base font-bold text-foreground">
                    Your Age
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Automatically determines your age group
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Enter your age (e.g. 68 or 24)"
                    className="h-11 text-base sm:w-48"
                  />

                  {detectedGroup ? (
                    <div
                      className={`flex-1 flex items-center justify-between p-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        detectedGroup.userGroup === "og"
                          ? "bg-[#315B4B]/10 border-[#315B4B]/30 text-[#315B4B]"
                          : "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="h-4 w-4 shrink-0" />
                        <span>
                          Group: <strong className="font-extrabold">{detectedGroup.label}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-current">
                        {detectedGroup.userGroup === "og" ? "O.G." : "Y.G."}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center">
                      Please enter your age.
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Your Neighborhoods (Up to 5, Pill Badges with ✕ matching screenshot) */}
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div>
                  <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Your Neighborhood</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select up to 5 neighborhoods you belong to or are close to*
                  </p>
                </div>

                {/* Selected Neighborhood Pills (Matching user's screenshot style) */}
                <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
                  {neighborhoods.map((place) => (
                    <span
                      key={place}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-xs animate-in fade-in zoom-in-95 duration-150"
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

                  {neighborhoods.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      No neighborhoods selected yet. Add at least one below.
                    </span>
                  )}
                </div>

                {/* Search & Add Neighborhood */}
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
                          placeholder="Type or search neighborhood (e.g. Urakami, Peace Park)..."
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

                    {/* Auto-suggestions Dropdown */}
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
                            <span className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <span>{name}</span>
                            </span>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Suggestion Chips */}
                {neighborhoods.length < 5 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Quick pick:</span>
                    {POPULAR_NEIGHBORHOODS.filter((p) => !neighborhoods.includes(p))
                      .slice(0, 4)
                      .map((place) => (
                        <button
                          key={place}
                          type="button"
                          onClick={() => addNeighborhood(place)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all flex items-center gap-1"
                        >
                          <Plus className="h-2.5 w-2.5 text-primary" />
                          <span>{place.split(",")[0]}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* 3. Preferred Contact Method */}
              <div className="space-y-2 pt-2 border-t border-border/70">
                <label className="text-sm sm:text-base font-bold text-foreground">
                  Preferred Contact Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContactMethod("chat")}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      contactMethod === "chat"
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>In-App Chat (Recommended)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Chat securely within Tsunagu after requests are accepted.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContactMethod("phone")}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      contactMethod === "phone"
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Phone Calls</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Shared only with consented partners on accepted requests.
                    </p>
                  </button>
                </div>
              </div>

              {/* 4. Skills Provided (Styled exactly like user's screenshot) */}
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div>
                  <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Services provided</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add up to 10 services or skills you can share*
                  </p>
                </div>

                {/* Skill Pills (Green pills with ✕) */}
                <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-xs animate-in fade-in zoom-in-95 duration-150"
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

                  {skills.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      No skills added yet. Add one below.
                    </span>
                  )}
                </div>

                {/* Auto-suggestion input for skills */}
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
                          placeholder="Type or search a skill (e.g. Traditional Cooking, Origami, Tech help)..."
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
                        <span>Add Skill</span>
                      </Button>
                    </div>

                    {/* Auto-suggestions Dropdown */}
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

                {/* Quick suggestions */}
                {skills.length < 10 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Suggestions:</span>
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 4)
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => addSkill(name)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all flex items-center gap-1"
                        >
                          <Plus className="h-2.5 w-2.5 text-primary" />
                          <span>{name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* 5. Services Needed (Styled like screenshot with auto-suggestion) */}
              <div className="space-y-3 pt-2 border-t border-border/70">
                <div>
                  <label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-secondary" />
                    <span>Services needed</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add up to 10 services or areas you would appreciate help with*
                  </p>
                </div>

                {/* Needed Pills (Green pills with ✕) */}
                <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
                  {servicesNeeded.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-xs animate-in fade-in zoom-in-95 duration-150"
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

                  {servicesNeeded.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      No services listed yet. Add one below.
                    </span>
                  )}
                </div>

                {/* Auto-suggestion input for needed services */}
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
                          placeholder="Type or search a need (e.g. Smartphone Assistance, Walking Companion)..."
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
                        <span>Add Need</span>
                      </Button>
                    </div>

                    {/* Auto-suggestions Dropdown */}
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

                {/* Quick suggestions */}
                {servicesNeeded.length < 10 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Suggestions:</span>
                    {SUGGESTED_SERVICES.filter((n) => !servicesNeeded.includes(n))
                      .slice(0, 4)
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => addNeed(name)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all flex items-center gap-1"
                        >
                          <Plus className="h-2.5 w-2.5 text-primary" />
                          <span>{name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 sm:px-8 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors order-2 sm:order-1"
              >
                Skip setup for now
              </button>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto font-bold text-sm h-11 px-8 bg-primary hover:bg-[#234336] text-white shadow-sm gap-2 flex items-center justify-center order-1 sm:order-2"
              >
                <span>{loading ? "Saving Profile..." : "Complete Setup & Go to Community"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
