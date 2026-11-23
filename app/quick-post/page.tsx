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
  HandHelping,
  Coins,
  Gift,
  ArrowLeftRight,
  AlertCircle,
  HelpCircle,
  UtensilsCrossed,
  Laptop,
  Palette,
  Flower2,
  HeartHandshake,
  Users,
} from "lucide-react";
import { REQUIREMENT_TEMPLATES, templatesByCategory } from "@/lib/templates";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES } from "@/lib/constants";
import { useSession } from "@/lib/services/authService";
import { createPost } from "@/lib/services/postService";
import type { Category, ExchangeMethod, PostType, RequirementTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function QuickPostWizardPage() {
  const router = useRouter();
  const session = useSession();

  // Wizard Steps:
  // 1 -> Type (Offer vs Request)
  // 2 -> Category
  // 3 -> Template Selection
  // 4 -> Details (prefilled, editable)
  // 5 -> Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [postType, setPostType] = useState<PostType>("offer");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Cooking");
  const [selectedTemplate, setSelectedTemplate] = useState<RequirementTemplate | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(session?.location || PLACES[0].name);
  const [availability, setAvailability] = useState(session?.availability || AVAILABILITY[0]);
  const [exchangeMethod, setExchangeMethod] = useState<ExchangeMethod>("free");
  const [amount, setAmount] = useState<number>(10);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTemplates = templatesByCategory(selectedCategory, postType);

  const handleSelectType = (type: PostType) => {
    setPostType(type);
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedTemplate(null);
    setStep(3);
  };

  const handleSelectTemplate = (template: RequirementTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setExchangeMethod(template.suggestedExchange);
    setStep(4);
  };

  const handlePublish = async () => {
    if (!selectedTemplate) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createPost({
        title,
        description,
        category: selectedCategory,
        skill: selectedTemplate.skill,
        location,
        availability,
        postType,
        exchangeMethod,
        amount: exchangeMethod === "paid" ? amount : null,
        templateId: selectedTemplate.id,
      });

      router.push(`/posts/${created.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create quick post.");
      setSubmitting(false);
    }
  };

  const categoryIcons: Record<Category, any> = {
    Cooking: UtensilsCrossed,
    Technology: Laptop,
    "Arts & Crafts": Palette,
    Gardening: Flower2,
    "Daily Assistance": HandHelping,
    Companionship: HeartHandshake,
    "Community & Local Activities": Users,
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Wizard Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-bold text-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Accessible Quick Post Wizard</span>
            </span>
            <span className="text-muted-foreground text-xs font-semibold">
              Step {step} of 5
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE OFFER OR REQUEST                                           */}
        {/* ========================================================================= */}
        {step === 1 && (
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-black text-foreground">
                What would you like to post?
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Choose whether you want to offer a skill or request a helping hand.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleSelectType("offer")}
                className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 group ${
                  postType === "offer"
                    ? "border-[#315B4B] bg-[#E7EEE4]/60 shadow-md"
                    : "border-border bg-background hover:border-[#315B4B]/60 hover:bg-[#FAF9F5]"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-[#315B4B] text-white flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-foreground mb-1">
                    I want to OFFER help
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share traditional cooking, gardening advice, origami, crafts, or companionship.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Continue with Offer</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType("request")}
                className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 group ${
                  postType === "request"
                    ? "border-blue-600 bg-blue-50/60 shadow-md"
                    : "border-border bg-background hover:border-blue-500/60 hover:bg-[#FAF9F5]"
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <HandHelping className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-foreground mb-1">
                    I want to REQUEST help
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get assistance with smartphones, heavy groceries, garden weeding, or finding a walking partner.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Continue with Request</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CHOOSE CATEGORY                                                   */}
        {/* ========================================================================= */}
        {step === 2 && (
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-black text-foreground">
                Select a Category
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Which area fits your {postType === "offer" ? "offer" : "request"} best?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-background hover:border-primary/60 hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-white text-primary" : "bg-[#E7EEE4] text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-base ${isSelected ? "text-white" : "text-foreground"}`}>
                        {cat}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SELECT SUGGESTED TEMPLATE                                         */}
        {/* ========================================================================= */}
        {step === 3 && (
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-black text-foreground">
                Choose a Template
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Pick a pre-filled draft to save time. You can edit all details in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {availableTemplates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No predefined templates for this combination yet. Please select another category.
                </div>
              ) : (
                availableTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-4 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-[#FAF9F5] text-left transition-all flex items-start justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                        {template.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded font-semibold">
                          Skill: {template.skill}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </button>
                ))
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: CONFIRM & CUSTOMIZE DETAILS                                      */}
        {/* ========================================================================= */}
        {step === 4 && (
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-2xl font-black text-foreground">
                Review & Confirm Details
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                We pre-filled this post based on your selected template. Feel free to customize.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Post Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Location Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Neighborhood / Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {PLACES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">When are you available?</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {AVAILABILITY.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exchange Method */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Exchange Arrangement</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EXCHANGE_METHODS.map((m) => {
                    const isSelected = exchangeMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setExchangeMethod(m.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-white font-bold"
                            : "border-border bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                          {m.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If Paid: amount input */}
              {exchangeMethod === "paid" && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  <label className="text-xs font-bold text-amber-900">
                    Simulated Demo Amount (USD / Credits)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs text-foreground"
                  />
                  <p className="text-[11px] text-amber-800">
                    DEMO only: No real money will be processed.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(3)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setStep(5)}
                className="gap-1 text-xs bg-primary hover:bg-[#234336] text-white font-bold"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: PREVIEW & PUBLISH                                                */}
        {/* ========================================================================= */}
        {step === 5 && (
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-2xl font-black text-foreground">
                Preview & Publish
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Here is how your community post will appear to neighbors in Nagasaki.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Post Preview Card */}
              <div className="rounded-xl border-2 border-primary/40 bg-[#FAF9F5] p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                      postType === "offer"
                        ? "bg-[#E7EEE4] text-[#234336] border border-[#315B4B]/30"
                        : "bg-blue-50 text-blue-800 border border-blue-300"
                    }`}
                  >
                    {postType.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Category: {selectedCategory}
                  </span>
                </div>

                <h3 className="font-black text-xl text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground font-medium">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-secondary" />
                    <span>{availability}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    Arrangement: {exchangeMethod === "free" ? "Free" : exchangeMethod === "exchange" ? "Skill Exchange" : `Paid ($${amount})`}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(4)} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Edit</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePublish}
                disabled={submitting}
                className="gap-1.5 text-xs bg-primary hover:bg-[#234336] text-white font-bold h-10 px-5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? "Publishing..." : "Publish Post"}</span>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
