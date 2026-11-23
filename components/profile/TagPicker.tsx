"use client";

import { useId, useMemo, useState } from "react";
import { HeartHandshake, Plus, Search, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { detectGeneration } from "@/lib/constants";

interface TagPickerProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: readonly string[];
  max: number;
  /** Called when the user tries to exceed `max`. */
  onLimit?: (message: string) => void;
  placeholder?: string;
  addLabel?: string;
  quickPickLabel?: string;
  emptyText?: string;
  /** Icon shown beside each suggestion in the dropdown. */
  suggestionIcon?: LucideIcon;
  /** Format the short label used in quick-pick chips. */
  formatQuickPick?: (value: string) => string;
}

/**
 * Pill-style multi-value picker with type-ahead suggestions, keyboard
 * navigation and quick-pick chips. Used for neighbourhoods, skills and
 * services on onboarding and profile editing.
 */
export function TagPicker({
  label,
  description,
  icon: Icon,
  iconClassName = "text-primary",
  values,
  onChange,
  suggestions,
  max,
  onLimit,
  placeholder,
  addLabel = "Add",
  quickPickLabel = "Suggestions:",
  emptyText = "Nothing added yet. Add one below.",
  suggestionIcon: SuggestionIcon,
  formatQuickPick = (v) => v,
}: TagPickerProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const available = useMemo(() => suggestions.filter((s) => !values.includes(s)), [suggestions, values]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available.slice(0, 6);
    return available.filter((s) => s.toLowerCase().includes(q));
  }, [query, available]);

  const atLimit = values.length >= max;

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (atLimit) {
      onLimit?.(`You can add up to ${max} items for ${label.toLowerCase()}.`);
      return;
    }
    if (!values.includes(value)) onChange([...values, value]);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      add(activeIndex >= 0 && filtered[activeIndex] ? filtered[activeIndex] : query);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = open && filtered.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <label htmlFor={`${id}-input`} className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
            {Icon && <Icon className={`h-4 w-4 ${iconClassName}`} />}
            <span>{label}</span>
          </label>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <span
          className={`text-xs font-semibold tabular-nums ${atLimit ? "text-amber-700" : "text-muted-foreground"}`}
          aria-live="polite"
        >
          {values.length}/{max}
        </span>
      </div>

      {/* Selected pills */}
      <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
        {values.map((value) => (
          <span
            key={value}
            className="group inline-flex max-w-full items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#315B4B] text-white shadow-xs animate-in fade-in zoom-in-95 duration-150 transition-colors hover:bg-[#274a3d]"
          >
            <span className="truncate">{value}</span>
            <button
              type="button"
              onClick={() => remove(value)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label={`Remove ${value}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-muted-foreground italic">{emptyText}</span>}
      </div>

      {!atLimit && (
        <>
          {/* Search & add */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Input
                  id={`${id}-input`}
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  onKeyDown={onKeyDown}
                  placeholder={placeholder}
                  className="min-h-[44px] text-sm pl-10"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => add(query)}
                disabled={!query.trim()}
                className="min-h-[44px] font-bold shrink-0 gap-1 rounded-full border-primary text-primary hover:bg-primary/10 px-4"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden min-[400px]:inline">{addLabel}</span>
              </Button>
            </div>

            {showDropdown && (
              <ul
                id={listId}
                role="listbox"
                className="absolute z-50 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-xl border-2 border-border bg-popover p-1.5 shadow-lift animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {filtered.map((name, i) => (
                  <li key={name} id={`${id}-opt-${i}`} role="option" aria-selected={i === activeIndex}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        add(name);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm rounded-lg font-medium text-foreground transition-colors ${
                        i === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {SuggestionIcon && <SuggestionIcon className="h-3.5 w-3.5 text-primary/70 shrink-0" />}
                        <span className="truncate">{name}</span>
                      </span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick-pick chips */}
          {available.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{quickPickLabel}</span>
              {available.slice(0, 4).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => add(name)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/40 hover:-translate-y-0.5 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  <span>{formatQuickPick(name)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Badge showing the generation detected from an age value. */
export function AgeGroupBadge({ group }: { group: ReturnType<typeof detectGeneration> | null }) {
  if (!group) {
    return <p className="text-xs text-muted-foreground flex items-center">Please enter your age.</p>;
  }
  const og = group.userGroup === "og";
  return (
    <div
      className={`flex-1 flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl border text-sm font-semibold animate-in fade-in zoom-in-95 ${
        og ? "bg-[#315B4B]/10 border-[#315B4B]/30 text-[#315B4B]" : "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]"
      }`}
    >
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 shrink-0" />
        <span>
          Group: <strong className="font-extrabold">{group.label}</strong>
        </span>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-current">
        {og ? "O.G." : "Y.G."}
      </span>
    </div>
  );
}
