"use client";

import type { UseFormReturn } from "react-hook-form";
import { AlertCircle, Check, Lightbulb, type LucideIcon } from "lucide-react";
import type { PostValues } from "@/lib/validators";
import { CATEGORIES, EXCHANGE_METHODS, PLACES, DEMO_AMOUNTS } from "@/lib/constants";
import { useSession } from "@/lib/services/authService";
import { AvailabilityPicker } from "@/components/profile/AvailabilityPicker";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { DemoPaymentBanner } from "@/components/common/DemoPaymentBanner";

const selectClass =
  "w-full min-h-[48px] rounded-md border-2 border-border bg-card px-4 text-base font-medium text-foreground transition-colors hover:border-primary/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const TIPS = [
  "Use a clear, friendly title that says exactly what you need or offer.",
  "Mention when you're free and any materials needed.",
  "Choose a public meeting area for first exchanges.",
  "Keep personal contact details out of the description.",
];

function Field({
  id,
  label,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm sm:text-base font-bold text-foreground">
          {label}
        </label>
        {counter && (
          <span
            className={`text-xs tabular-nums ${
              counter.value > counter.max * 0.9 ? "text-amber-700 font-semibold" : "text-muted-foreground"
            }`}
          >
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

/**
 * Shared create / edit form for standard community posts.
 */
export function PostForm({
  form,
  onSubmit,
  onCancel,
  error,
  loading,
  icon: Icon,
  eyebrow,
  title,
  description,
  submitLabel,
  loadingLabel,
}: {
  form: UseFormReturn<PostValues>;
  onSubmit: (values: PostValues) => void | Promise<void>;
  onCancel: () => void;
  error: string | null;
  loading: boolean;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  submitLabel: string;
  loadingLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const session = useSession();
  const exchangeMethod = watch("exchangeMethod");
  const availability = watch("availability") || "Flexible";
  const currentLocation = watch("location");
  // The member's own area first, then the known neighbourhoods (and keep an
  // existing post's custom location selectable)
  const locationOptions = Array.from(
    new Set([session?.location, currentLocation, ...PLACES.map((p) => p.name)].filter((x): x is string => Boolean(x && x.trim()))),
  );
  const selectedAmount = watch("amount");
  const titleLen = watch("title")?.length ?? 0;
  const descLen = watch("description")?.length ?? 0;

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_17rem] gap-6 lg:gap-8 items-start">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0 rounded-2xl border-2 border-border bg-card shadow-sm overflow-clip animate-fade-up"
          noValidate
        >
          <header className="relative overflow-hidden space-y-2 border-b border-border px-5 py-6 sm:px-8 sm:py-8 bg-gradient-to-b from-[#E7EEE4]/50 to-transparent">
            <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-center gap-2 text-primary font-bold text-sm">
              <Icon className="h-5 w-5" />
              <span>{eyebrow}</span>
            </div>
            <h1 className="relative text-2xl sm:text-3xl font-extrabold text-foreground leading-tight break-words">{title}</h1>
            {description && <p className="relative text-sm sm:text-base text-muted-foreground">{description}</p>}
          </header>

          <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Field id="pf-category" label="Category">
              <select id="pf-category" {...register("category")} className={selectClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="pf-title" label="Post Title" error={errors.title?.message} counter={{ value: titleLen, max: 100 }}>
              <Input
                id="pf-title"
                maxLength={100}
                placeholder="e.g. Need help setting up video calls with family"
                {...register("title")}
                aria-invalid={Boolean(errors.title)}
              />
            </Field>

            <Field id="pf-skill" label="Primary Skill or Service" error={errors.skill?.message}>
              <Input
                id="pf-skill"
                maxLength={60}
                placeholder="e.g. Origami, Grocery shopping, Smartphone setup"
                {...register("skill")}
                aria-invalid={Boolean(errors.skill)}
              />
            </Field>

            <Field
              id="pf-description"
              label="Description"
              error={errors.description?.message}
              counter={{ value: descLen, max: 800 }}
            >
              <Textarea
                id="pf-description"
                rows={5}
                maxLength={800}
                placeholder="Describe what you are looking for, when you're free, and any materials or expectations..."
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
              />
            </Field>

            <Field id="pf-location" label="Location / Neighborhood" error={errors.location?.message}>
              <select id="pf-location" {...register("location")} className={selectClass}>
                {locationOptions.map((name) => (
                  <option key={name} value={name}>
                    {name === session?.location ? `📍 ${name} (my location)` : name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="pf-availability" label="Availability" error={errors.availability?.message}>
              <AvailabilityPicker
                idPrefix="pf-avail"
                compact
                value={availability}
                onChange={(next) => setValue("availability", next, { shouldDirty: true, shouldValidate: true })}
              />
            </Field>

            {/* Exchange arrangement */}
            <fieldset className="space-y-3 pt-5 border-t border-border/80">
              <legend className="text-sm sm:text-base font-bold text-foreground mb-3">Exchange Arrangement</legend>
              <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EXCHANGE_METHODS.map((method) => {
                  const selected = exchangeMethod === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setValue("exchangeMethod", method.value, { shouldDirty: true });
                        // Clear any stale demo amount when leaving the paid option
                        if (method.value !== "paid") setValue("amount", null, { shouldDirty: true });
                      }}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border bg-background hover:border-primary/30 hover:bg-muted/60"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in zoom-in-95">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <div className="font-bold text-sm text-foreground pr-6">{method.label}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{method.hint}</p>
                    </button>
                  );
                })}
              </div>

              {exchangeMethod === "paid" && (
                <div className="space-y-3 p-4 rounded-xl border border-blue-200 bg-blue-50/50 animate-in fade-in slide-in-from-top-1">
                  <DemoPaymentBanner />
                  <p className="text-sm font-bold text-foreground">Select Demo Amount (£)</p>
                  <div className="grid grid-cols-4 gap-2 max-w-sm">
                    {DEMO_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setValue("amount", amt, { shouldValidate: true, shouldDirty: true })}
                        aria-pressed={selectedAmount === amt}
                        className={`min-h-[44px] rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                          selectedAmount === amt
                            ? "border-blue-700 bg-blue-700 text-white shadow-md"
                            : "border-border bg-card hover:border-blue-400 text-foreground"
                        }`}
                      >
                        £{amt}
                      </button>
                    ))}
                  </div>
                  {errors.amount && <p className="text-xs text-destructive font-medium">{errors.amount.message}</p>}
                </div>
              )}
            </fieldset>
          </div>

          <footer className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur-md px-5 py-4 sm:px-8 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold flex-1 sm:flex-none sm:px-8" disabled={loading}>
              {loading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              {loading ? loadingLabel : submitLabel}
            </Button>
          </footer>
        </form>

        {/* Tips (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-24 rounded-2xl border-2 border-border bg-card p-5 space-y-4 animate-fade-up [animation-delay:150ms]">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Lightbulb className="h-4 w-4" />
            </span>
            Tips for a great post
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
