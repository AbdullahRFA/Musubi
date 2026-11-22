"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  BookOpen,
  HandHelping,
  Coins,
  Smile,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { REQUIREMENT_TEMPLATES, templatesByCategory } from "@/lib/templates";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES } from "@/lib/constants";
import { useSession } from "@/lib/services/authService";
import { createPost } from "@/lib/services/postService";
import type { Category, ExchangeMethod, RequirementTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function QuickPostWizardPage() {
  const router = useRouter();
  const session = useSession();

  // Wizard Steps: 1 -> Category, 2 -> Template, 3 -> Details, 4 -> Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<Category>("Daily Assistance");
  const [selectedTemplate, setSelectedTemplate] = useState<RequirementTemplate | null>(null);
  const [location, setLocation] = useState(session?.location || PLACES[0].name);
  const [availability, setAvailability] = useState(session?.availability || AVAILABILITY[0]);
  const [exchangeMethod, setExchangeMethod] = useState<ExchangeMethod>("service");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTemplates = templatesByCategory(selectedCategory);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleSelectTemplate = (template: RequirementTemplate) => {
    setSelectedTemplate(template);
    setExchangeMethod(template.suggestedExchange);
    setStep(3);
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    setError(null);
    setSubmitting(true);
    try {
      const generatedTitle = `Need help with: ${selectedTemplate.title}`;
      const generatedDescription = `${selectedTemplate.description} I live in ${location} and I am usually available ${availability}. I would love to connect with a friendly neighbor!`;

      const created = await createPost({
        title: generatedTitle,
        description: generatedDescription,
        category: selectedCategory,
        skill: selectedTemplate.skill,
        location,
        availability,
        postType: "request",
        exchangeMethod,
        amount: exchangeMethod === "payment" ? 10 : null,
        templateId: selectedTemplate.id,
      });

      router.push(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create quick post.");
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Wizard Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-bold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Quick Post Wizard for Older Generation & Beginners</span>
            </span>
            <span className="text-muted-foreground">Step {step} of 4</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card Container */}
        <Card className="border-2 border-border bg-card shadow-lg">
          {/* STEP 1: Select Category */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-extrabold text-foreground">
                  What kind of help or companionship are you looking for?
                </CardTitle>
                <CardDescription className="text-lg">
                  Tap one category below to see common everyday templates.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-border bg-[#fffdfa] hover:border-primary hover:bg-primary/5 transition-all text-left shadow-xs group"
                  >
                    <span className="text-xl font-bold text-foreground group-hover:text-primary">
                      {cat}
                    </span>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </CardContent>
            </>
          )}

          {/* STEP 2: Select Template */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-extrabold text-foreground">
                  Choose a Pre-Written Template
                </CardTitle>
                <CardDescription className="text-lg">
                  Category: <strong className="text-primary">{selectedCategory}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                {availableTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className="w-full flex flex-col p-5 rounded-xl border-2 border-border bg-[#fffdfa] hover:border-primary hover:bg-primary/5 transition-all text-left shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-foreground group-hover:text-primary">
                        {tpl.title}
                      </span>
                      <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-base text-muted-foreground mt-1">{tpl.description}</p>
                  </button>
                ))}
              </CardContent>

              <CardFooter className="border-t border-border pt-4">
                <Button variant="outline" size="lg" onClick={() => setStep(1)} className="gap-2 font-semibold">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Categories</span>
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 3: Simple Details (Location, Availability, Exchange) */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-extrabold text-foreground">
                  Confirm a Few Basic Details
                </CardTitle>
                <CardDescription className="text-lg">
                  Selected: <strong className="text-primary">{selectedTemplate?.title}</strong>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {/* Location Selection */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>Your Neighborhood</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLACES.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setLocation(p.name)}
                        className={`py-3 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          location === p.name
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability Selection */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-5 w-5 text-secondary" />
                    <span>When are you usually free?</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {AVAILABILITY.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAvailability(a)}
                        className={`py-3 px-3 rounded-lg border-2 text-xs sm:text-sm font-semibold transition-all ${
                          availability === a
                            ? "border-secondary bg-secondary text-white"
                            : "border-border bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exchange Method */}
                <div className="space-y-2">
                  <label className="text-base font-bold text-foreground">
                    Preferred Exchange Arrangement
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EXCHANGE_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setExchangeMethod(m.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          exchangeMethod === m.value
                            ? "border-primary bg-primary/10 shadow-xs"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <div className="font-bold text-sm text-foreground">{m.label}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-4 flex justify-between">
                <Button variant="outline" size="lg" onClick={() => setStep(2)} className="gap-2 font-semibold">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </Button>
                <Button size="lg" onClick={() => setStep(4)} className="gap-2 font-bold">
                  <span>Next: Preview Post</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 4: Preview Auto-Generated Post & Confirm */}
          {step === 4 && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-extrabold text-foreground">
                  Preview Your Post
                </CardTitle>
                <CardDescription className="text-lg">
                  Everything was automatically formatted for you. No typing needed!
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Auto-Generated Card Preview */}
                <div className="rounded-xl border-2 border-primary/50 bg-[#fffdfa] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                      Requesting Help
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Category: {selectedCategory}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-foreground">
                    Need help with: {selectedTemplate?.title}
                  </h3>

                  <p className="text-base text-foreground leading-relaxed">
                    {selectedTemplate?.description} I live in {location} and I am usually available{" "}
                    {availability}. I would love to connect with a friendly neighbor!
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/80 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Neighborhood:</span>
                      <strong className="text-foreground text-sm">{location}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Availability:</span>
                      <strong className="text-foreground text-sm">{availability}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-sm">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-700" />
                  <span>When you publish, nearby neighbors will be able to see your request.</span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-4 flex justify-between gap-4">
                <Button variant="outline" size="lg" onClick={() => setStep(3)} className="gap-2 font-semibold">
                  <ArrowLeft className="h-5 w-5" />
                  <span>Edit Details</span>
                </Button>

                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={submitting}
                  className="font-bold text-lg px-8 shadow-md bg-primary hover:bg-[#832c0f] text-white"
                >
                  {submitting ? "Publishing..." : "Confirm & Publish Post"}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}
