"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  HandHelping,
  AlertCircle,
  UtensilsCrossed,
  Laptop,
  Palette,
  Flower2,
  HeartHandshake,
  Users,
  Check,
  type LucideIcon,
} from "lucide-react";
import { templatesByCategory } from "@/lib/templates";
import { CATEGORIES, EXCHANGE_METHODS, AVAILABILITY, PLACES, DEMO_AMOUNTS } from "@/lib/constants";
import { postSchema } from "@/lib/validators";
import { money } from "@/lib/utils";
import { useSession } from "@/lib/services/authService";
import { createPost } from "@/lib/services/postService";
import type { Category, ExchangeMethod, PostType, RequirementTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/AuthGuard";
import { ExchangeBadge, PostTypeBadge, POST_TYPE_ACCENT } from "@/components/posts/PostBadges";

export default function QuickPostWizardPage() {
  const router = useRouter();
  const session = useSession();

  // Wizard Steps:
  // 1 -> Category
  // 2 -> Template Selection
  // 3 -> Details (prefilled, editable)
  // 4 -> Preview & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State — defaults directly to "request"
  const [postType] = useState<PostType>("request");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Cooking");
  const [selectedTemplate, setSelectedTemplate] = useState<RequirementTemplate | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(session?.location || PLACES[0].name);
  const [availability, setAvailability] = useState(session?.availability || AVAILABILITY[0]);
  const [exchangeMethod, setExchangeMethod] = useState<ExchangeMethod>("free");
  const [amount, setAmount] = useState<number>(DEMO_AMOUNTS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTemplates = templatesByCategory(selectedCategory, postType);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleSelectTemplate = (template: RequirementTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setExchangeMethod(template.suggestedExchange);
    setStep(3);
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

  // Validate step 3 with the same schema used by the standard post form
  const goToPreview = () => {
    const result = postSchema.safeParse({
      title,
      description,
      category: selectedCategory,
      skill: selectedTemplate?.skill ?? "",
      location,
      availability,
      postType,
      exchangeMethod,
      amount: exchangeMethod === "paid" ? amount : null,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setError(null);
    setStep(4);
  };

  // Keep the wizard in view when moving between steps (important on phones)
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const categoryIcons: Record<Category, LucideIcon> = {
    Cooking: UtensilsCrossed,
    Technology: Laptop,
    "Arts & Crafts": Palette,
    Gardening: Flower2,
    "Daily Assistance": HandHelping,
    Companionship: HeartHandshake,
    "Community & Local Activities": Users,
  };

  const STEP_LABELS = ["Category", "Template", "Details", "Publish"];
  const inputClass =
    "w-full min-h-[48px] rounded-md border-2 border-border bg-card px-4 py-2.5 text-base text-foreground transition-colors hover:border-primary/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <AuthGuard>
      <div ref={topRef} className="page-container max-w-3xl py-6 sm:py-10 space-y-6 scroll-mt-20">
        {/* ---------- Stepper ---------- */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="h-4 w-4" />
              Accessible Quick Post Wizard
            </span>
            <span className="text-muted-foreground text-xs font-semibold" aria-live="polite">
              Step {step} of 4
            </span>
          </div>
          <ol className="grid grid-cols-4 gap-2" aria-label="Wizard progress">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3 | 4;
              const done = n < step;
              const current = n === step;
              return (
                <li key={label} className="space-y-2" aria-current={current ? "step" : undefined}>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-primary transition-[width] duration-500 ease-smooth ${
                        n <= step ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => setStep(n)}
                    className={`flex w-full items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold transition-colors ${
                      current ? "text-primary" : done ? "text-foreground hover:text-primary" : "text-muted-foreground"
                    } disabled:cursor-default`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                        done
                          ? "bg-primary text-primary-foreground"
                          : current
                          ? "border-2 border-primary text-primary"
                          : "border-2 border-border"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" /> : n}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ---------- Step 1: category ---------- */}
        {step === 1 && (
          <StepShell
            key={step}
            title="Select a Category"
            description="Which area fits your request best?"
            footer={<BackButton to={() => router.back()} />}
          >
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcons[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 flex min-[420px]:flex-col items-center min-[420px]:items-start gap-3 hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-background hover:border-primary/50 hover:shadow-soft"
                    }`}
                  >
                    <span
                      className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                        isSelected ? "bg-white text-primary" : "bg-[#E7EEE4] text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-bold text-base">{cat}</span>
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* ---------- Step 2: template ---------- */}
        {step === 2 && (
          <StepShell
            key={step}
            title="Choose a Template"
            description="Pick a pre-filled draft to save time. You can edit all details in the next step."
            footer={<BackButton to={() => setStep(1)} />}
          >
            <div className="space-y-3">
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
                    className="group w-full p-4 sm:p-5 rounded-xl border-2 border-border bg-background text-left transition-all duration-200 flex items-start justify-between gap-4 hover:border-primary/60 hover:shadow-soft hover:-translate-y-0.5"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <h2 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                        {template.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                      <span className="inline-block bg-muted px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground">
                        Skill: {template.skill}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
          </StepShell>
        )}

        {/* ---------- Step 3: details ---------- */}
        {step === 3 && (
          <StepShell
            key={step}
            title="Review & Confirm Details"
            description="We pre-filled this post based on your selected template. Feel free to customize."
            footer={
              <>
                <BackButton to={() => setStep(2)} />
                <Button onClick={goToPreview} className="group gap-1.5 font-bold">
                  Continue to Preview
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </>
            }
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="qp-title" className="text-sm font-bold text-foreground">
                  Post Title
                </label>
                <input
                  id="qp-title"
                  type="text"
                  value={title}
                  maxLength={100}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="qp-desc" className="text-sm font-bold text-foreground">
                  Description
                </label>
                <textarea
                  id="qp-desc"
                  rows={4}
                  maxLength={800}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[120px]`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="qp-location" className="text-sm font-bold text-foreground">
                    Neighborhood / Location
                  </label>
                  <select id="qp-location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
                    {PLACES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="qp-availability" className="text-sm font-bold text-foreground">
                    When are you available?
                  </label>
                  <select
                    id="qp-availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className={inputClass}
                  >
                    {AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-foreground mb-2">Exchange Arrangement</legend>
                <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {EXCHANGE_METHODS.map((m) => {
                    const isSelected = exchangeMethod === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setExchangeMethod(m.value)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-glow"
                            : "border-border bg-background hover:border-primary/40 hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div className="text-sm font-bold">{m.label}</div>
                        <div className={`text-xs mt-0.5 ${isSelected ? "text-white/85" : "text-muted-foreground"}`}>{m.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {exchangeMethod === "paid" && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <p className="text-sm font-bold text-amber-900">Simulated Demo Amount (£)</p>
                  <div className="grid grid-cols-4 gap-2 max-w-sm">
                    {DEMO_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        aria-pressed={amount === amt}
                        className={`min-h-[44px] rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                          amount === amt
                            ? "border-amber-700 bg-amber-700 text-white shadow-md"
                            : "border-amber-200 bg-white hover:border-amber-400 text-foreground"
                        }`}
                      >
                        {money(amt)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-800">DEMO only: No real money will be processed.</p>
                </div>
              )}
            </div>
          </StepShell>
        )}

        {/* ---------- Step 4: preview ---------- */}
        {step === 4 && (
          <StepShell
            key={step}
            title="Preview & Publish"
            description="Here is how your community post will appear to neighbors in Nagasaki."
            footer={
              <>
                <BackButton to={() => setStep(3)} label="Back to Edit" />
                <Button onClick={handlePublish} disabled={submitting} className="gap-1.5 font-bold px-6">
                  {submitting ? (
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {submitting ? "Publishing..." : "Publish Post"}
                </Button>
              </>
            }
          >
            <article className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-background shadow-soft">
              <div className={`h-1.5 w-full ${POST_TYPE_ACCENT[postType]}`} />
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <PostTypeBadge type={postType} />
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {selectedCategory}
                    </span>
                  </div>
                  <ExchangeBadge method={exchangeMethod} amount={exchangeMethod === "paid" ? amount : null} />
                </div>
                <h2 className="font-black text-xl text-foreground break-words">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-secondary" />
                    {availability}
                  </span>
                </div>
              </div>
            </article>
          </StepShell>
        )}
      </div>
    </AuthGuard>
  );
}

function StepShell({
  title: stepTitle,
  description: stepDesc,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden animate-fade-up">
      <header className="px-5 py-5 sm:px-8 sm:py-6 border-b border-border text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">{stepTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{stepDesc}</p>
      </header>
      <div className="px-5 py-5 sm:px-8 sm:py-6">{children}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-8">
        {footer}
      </footer>
    </section>
  );
}

function BackButton({ to, label = "Back" }: { to: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={to} className="group gap-1.5">
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Button>
  );
}
