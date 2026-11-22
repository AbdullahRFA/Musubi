"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, MapPin, Clock, Phone, MessageSquare, Check } from "lucide-react";
import { onboardingSchema } from "@/lib/validators";
import { useSession } from "@/lib/services/authService";
import { updateProfile } from "@/lib/services/profileService";
import { AGE_GROUPS, AVAILABILITY, PLACES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

type OnboardingValues = {
  ageGroup: "18-29" | "30-49" | "50-64" | "65+";
  location: string;
  availability: string;
  contactMethod: "chat" | "phone";
  skill: string;
  need: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      ageGroup: session?.userGroup === "og" ? "65+" : "18-29",
      location: PLACES[0].name,
      availability: AVAILABILITY[0],
      contactMethod: "chat",
      skill: "",
      need: "",
    },
  });

  const selectedAge = watch("ageGroup");
  const selectedLocation = watch("location");
  const selectedAvailability = watch("availability");
  const selectedContact = watch("contactMethod");

  const onSubmit = async (values: OnboardingValues) => {
    setLoading(true);
    try {
      await updateProfile({
        ageGroup: values.ageGroup,
        location: values.location,
        availability: values.availability,
        contactMethod: values.contactMethod,
        skills: values.skill.trim() ? [values.skill.trim()] : [],
        servicesNeeded: values.need.trim() ? [values.need.trim()] : [],
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl shadow-md border-2 border-border bg-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome, {session?.fullName}!</CardTitle>
            <CardDescription className="text-base">
              Set up a few basic preferences so neighbors can connect with you. You can adjust these anytime.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Age Group */}
              <div className="space-y-2">
                <label className="text-base font-bold text-foreground">Your Age Group</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AGE_GROUPS.map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setValue("ageGroup", age)}
                      className={`py-3 px-2 rounded-md border-2 text-center font-semibold text-sm transition-all ${
                        selectedAge === age
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Your Neighborhood</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLACES.map((place) => (
                    <button
                      key={place.name}
                      type="button"
                      onClick={() => setValue("location", place.name)}
                      className={`py-3 px-3 rounded-md border-2 text-left font-medium text-sm transition-all flex items-center justify-between ${
                        selectedLocation === place.name
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      <span>{place.name}</span>
                      {selectedLocation === place.name && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <label className="text-base font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span>General Availability</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABILITY.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setValue("availability", slot)}
                      className={`py-2.5 px-3 rounded-md border-2 text-left font-medium text-xs sm:text-sm transition-all ${
                        selectedAvailability === slot
                          ? "border-secondary bg-secondary text-white"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Method */}
              <div className="space-y-2">
                <label className="text-base font-bold text-foreground">Preferred Contact Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "chat")}
                    className={`p-3 rounded-md border-2 text-left transition-all ${
                      selectedContact === "chat"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>In-App Chat (Recommended)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chat securely within Tsunagu after requests are accepted.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue("contactMethod", "phone")}
                    className={`p-3 rounded-md border-2 text-left transition-all ${
                      selectedContact === "phone"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Phone Calls</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shared only with consented partners on accepted requests.
                    </p>
                  </button>
                </div>
              </div>

              {/* One Skill and One Need (Optional initial tag) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    A skill or knowledge you can share:
                  </label>
                  <Input
                    placeholder="e.g. Traditional cooking, Smartphone help..."
                    {...register("skill")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">
                    Something you would appreciate help with:
                  </label>
                  <Input
                    placeholder="e.g. Grocery pickup, Walking companion..."
                    {...register("need")}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" size="lg" className="w-full text-base font-bold" disabled={loading}>
                {loading ? "Saving profile..." : "Complete Setup & Go to Dashboard"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthGuard>
  );
}
