"use client";

import { forwardRef, useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/common/GoogleIcon";

/**
 * Minimal authentication layout: one centred, frosted-glass card over a
 * slowly drifting brand-colour background. Used by login, register,
 * forgot-password and reset-password so they all look the same.
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
    <div className="relative isolate flex min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <AuthBackground />

      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-white/60 bg-card/75 p-6 shadow-lift backdrop-blur-xl supports-[backdrop-filter]:bg-card/65 min-[400px]:p-8">
          <div className="mb-6 space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Decorative animated background: three large blurred colour fields that
 * drift slowly, over a soft gradient and a faint dot grid. Pure CSS (GPU
 * transforms only), hidden from assistive tech, and frozen automatically for
 * users who prefer reduced motion (see globals.css).
 */
function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f6f1e8] via-[#efe6d9] to-[#e7eee4]" />
      <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl animate-blob" />
      <div className="absolute -right-20 top-1/4 h-[26rem] w-[26rem] rounded-full bg-[#315B4B]/25 blur-3xl animate-blob [animation-delay:-6s]" />
      <div className="absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-amber-300/30 blur-3xl animate-blob [animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(36,28,22,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
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

      <div className="my-1 flex items-center gap-3" role="separator">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dividerLabel}</span>
        <span className="h-px flex-1 bg-border" />
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
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  return (
    <div className="space-y-1.5">
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`pr-12 ${className ?? ""}`}
        {...props}
        onKeyUp={(e) => {
          checkCaps(e);
          props.onKeyUp?.(e);
        }}
        onKeyDown={(e) => {
          checkCaps(e);
          props.onKeyDown?.(e);
        }}
        onBlur={(e) => {
          setCapsLock(false);
          props.onBlur?.(e);
        }}
      />
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
    {capsLock && (
      <p role="status" className="text-xs font-semibold text-amber-700">
        Caps Lock is on
      </p>
    )}
    </div>
  );
});

/** Live password strength meter with checklist (used when choosing a new password). */
export function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { ok: value.length >= 8, label: "8+ characters" },
    { ok: /[A-Za-z]/.test(value) && /\d/.test(value), label: "Letters & numbers" },
    { ok: /[A-Z]/.test(value) && /[a-z]/.test(value), label: "Upper & lower case" },
    { ok: /[^A-Za-z0-9]/.test(value), label: "A symbol" },
  ];
  const score = checks.filter((c) => c.ok).length + (value.length >= 12 ? 1 : 0);
  const level =
    value.length === 0
      ? { label: "", bar: "bg-muted", text: "text-muted-foreground" }
      : score <= 1
      ? { label: "Weak", bar: "bg-destructive", text: "text-destructive" }
      : score <= 3
      ? { label: "Fair", bar: "bg-amber-500", text: "text-amber-700" }
      : { label: "Strong", bar: "bg-success", text: "text-success" };

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-colors duration-300 ${i < score && value ? level.bar : "bg-muted"}`}
            />
          ))}
        </div>
        {level.label && <span className={`text-xs font-bold w-12 text-right ${level.text}`}>{level.label}</span>}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1.5 transition-colors ${c.ok ? "text-success font-semibold" : "text-muted-foreground"}`}
          >
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
                c.ok ? "bg-success text-white" : "border border-border"
              }`}
              aria-hidden="true"
            >
              {c.ok ? "✓" : ""}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
