"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Plus, X, AlertCircle, Save } from "lucide-react";
import { profileSchema, type ProfileValues } from "@/lib/validators";
import { useSession } from "@/lib/services/authService";
import { updateProfile } from "@/lib/services/profileService";
import { AGE_GROUPS, AVAILABILITY, PLACES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function EditProfilePage() {
  const router = useRouter();
  const session = useSession();

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [servicesNeeded, setServicesNeeded] = useState<string[]>([]);
  const [newNeed, setNewNeed] = useState("");

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
        userGroup: session.userGroup,
        ageGroup: session.ageGroup ?? "",
        location: session.location,
        bio: session.bio,
        availability: session.availability,
        contactMethod: session.contactMethod,
        phone: session.phone ?? "",
        interests: session.interests,
        skills: session.skills,
        servicesOffered: session.servicesOffered,
        servicesNeeded: session.servicesNeeded,
      });
      setSkills(session.skills);
      setServicesNeeded(session.servicesNeeded);
    }
  }, [session, reset]);

  const contactMethod = watch("contactMethod");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const next = [...skills, newSkill.trim()];
      setSkills(next);
      setValue("skills", next);
      setNewSkill("");
    }
  };

  const removeSkill = (tag: string) => {
    const next = skills.filter((s) => s !== tag);
    setSkills(next);
    setValue("skills", next);
  };

  const addNeed = () => {
    if (newNeed.trim() && !servicesNeeded.includes(newNeed.trim())) {
      const next = [...servicesNeeded, newNeed.trim()];
      setServicesNeeded(next);
      setValue("servicesNeeded", next);
      setNewNeed("");
    }
  };

  const removeNeed = (tag: string) => {
    const next = servicesNeeded.filter((n) => n !== tag);
    setServicesNeeded(next);
    setValue("servicesNeeded", next);
  };

  const onSubmit = async (values: ProfileValues) => {
    setError(null);
    setSaving(true);
    try {
      await updateProfile({
        fullName: values.fullName,
        email: values.email,
        userGroup: values.userGroup,
        ageGroup: values.ageGroup === "" ? null : values.ageGroup,
        location: values.location,
        bio: values.bio,
        availability: values.availability,
        contactMethod: values.contactMethod,
        phone: values.contactMethod === "phone" ? values.phone : null,
        skills,
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Card className="border-2 border-border bg-card shadow-md">
          <CardHeader className="border-b border-border pb-6 space-y-1">
            <CardTitle className="text-3xl font-extrabold text-foreground">Edit Your Profile</CardTitle>
            <p className="text-base text-muted-foreground">
              Update your biography, expertise tags, and contact preferences
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Full Name</label>
                <Input {...register("fullName")} aria-invalid={Boolean(errors.fullName)} />
                {errors.fullName && (
                  <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Short Biography</label>
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

              {/* Location & Age Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-foreground">Neighborhood</label>
                  <select
                    {...register("location")}
                    className="w-full rounded-md border-2 border-border bg-background p-3 text-sm font-medium text-foreground"
                  >
                    {PLACES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-base font-bold text-foreground">Age Group</label>
                  <select
                    {...register("ageGroup")}
                    className="w-full rounded-md border-2 border-border bg-background p-3 text-sm font-medium text-foreground"
                  >
                    <option value="">Prefer not to say</option>
                    {AGE_GROUPS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-1.5">
                <label className="text-base font-bold text-foreground">Availability</label>
                <select
                  {...register("availability")}
                  className="w-full rounded-md border-2 border-border bg-background p-3 text-sm font-medium text-foreground"
                >
                  {AVAILABILITY.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <label className="text-base font-bold text-foreground">Preferred Contact Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "chat")}
                    className={`p-3 rounded-lg border-2 text-left font-bold text-sm ${
                      contactMethod === "chat"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    In-App Chat Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "phone")}
                    className={`p-3 rounded-lg border-2 text-left font-bold text-sm ${
                      contactMethod === "phone"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    Allow Phone Contact
                  </button>
                </div>

                {contactMethod === "phone" && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-bold text-foreground">
                      Phone Number (Shown only after a request is accepted)
                    </label>
                    <Input
                      placeholder="+44 7700 900077"
                      {...register("phone")}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tag Input: Skills & Expertise */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <label className="text-base font-bold text-foreground">Skills & Knowledge to Share</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g. Calligraphy, Smartphone setup)..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline" className="shrink-0 gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-full border border-primary/20"
                    >
                      <span>{s}</span>
                      <button type="button" onClick={() => removeSkill(s)}>
                        <X className="h-3.5 w-3.5 hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tag Input: Services Needed */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <label className="text-base font-bold text-foreground">Help & Services Needed</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a need (e.g. Grocery carrying, Garden weeding)..."
                    value={newNeed}
                    onChange={(e) => setNewNeed(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNeed())}
                  />
                  <Button type="button" onClick={addNeed} variant="outline" className="shrink-0 gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {servicesNeeded.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary font-bold text-xs px-3 py-1 rounded-full border border-secondary/20"
                    >
                      <span>{n}</span>
                      <button type="button" onClick={() => removeNeed(n)}>
                        <X className="h-3.5 w-3.5 hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-4 flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="font-bold gap-2" disabled={saving}>
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
