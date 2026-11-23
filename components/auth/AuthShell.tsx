"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff, BookOpen, HandHelping, HeartHandshake, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/common/GoogleIcon";

const HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: BookOpen, title: "Share & learn", body: "Trade lifetime wisdom for modern skills." },
  { icon: HandHelping, title: "Everyday help", body: "Neighbours lending a patient hand." },
  { icon: ShieldCheck, title: "Safe by design", body: "Chat unlocks only after a request is accepted." },
];

/**
 * Two-column authentication layout: a decorative brand panel on large
 * screens and a centred form card on every screen size.
 */
export function AuthShell({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border-2 border-border bg-card shadow-lift lg:grid-cols-[1fr_1.1fr]">
        {/* Brand panel */}
        <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#234336] via-[#2F5344] to-[#1c332a] p-10 text-white">
          <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden="true" />

          <Link href="/" className="relative inline-flex items-center gap-1.5">
            <span className="font-black text-2xl text-amber-300">Tsunagu</span>
            <span className="font-bold text-xl">Generations</span>
          </Link>

          <div className="relative space-y-6">
            <HeartHandshake className="h-12 w-12 text-amber-300 animate-float" />
            <h2 className="text-3xl font-black leading-tight text-balance">
              Everyone has something to share. Everyone has something to gain.
            </h2>
            <ul className="space-y-4">
              {HIGHLIGHTS.map(({ icon: HIcon, title: hTitle, body }) => (
                <li key={hTitle} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                    <HIcon className="h-4 w-4 text-amber-300" />
                  </span>
                  <div>
                    <p className="font-bold text-sm">{hTitle}</p>
                    <p className="text-sm text-white/75">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/60 italic">“Connecting the Past to the Present”</p>
        </aside>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-5 min-[400px]:p-7 sm:p-10 animate-fade-up">
          <div className="space-y-2 text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1"
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/** Google OAuth button followed by an "or" divider. */
export function GoogleAuthButton({
  onClick,
  loading,
  disabled,
  label,
  dividerLabel,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  label: string;
  dividerLabel: string;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={loading || disabled}
        className="w-full gap-3 font-semibold hover:shadow-soft"
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>{loading ? "Connecting to Google..." : label}</span>
      </Button>

      <div className="relative my-1" role="separator">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wide">{dividerLabel}</span>
        </div>
      </div>
    </>
  );
}

/** Labelled form field wrapper with error message. */
export function AuthField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <label htmlFor={id} className="text-sm font-bold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />;
}

/** Password input with an accessible show / hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className={`pr-12 ${className ?? ""}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
