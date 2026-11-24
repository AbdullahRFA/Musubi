"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CalendarPlus, Check, Plus, X } from "lucide-react";
import { AVAILABILITY } from "@/lib/constants";
import { formatCustomSlot, joinAvailability, MAX_CUSTOM_SLOTS, parseAvailability } from "@/lib/availability";
import { Button } from "@/components/ui/button";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * General availability presets plus an "Add a specific date & time" button for
 * custom slots (day / month / year and an optional start–end time).
 * The value is a single string — see lib/availability.ts.
 */
export function AvailabilityPicker({
  value,
  onChange,
  idPrefix = "avail",
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  idPrefix?: string;
  /** Smaller preset buttons for use inside post forms. */
  compact?: boolean;
}) {
  const { preset, custom } = useMemo(() => parseAvailability(value), [value]);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setDate("");
    setStart("");
    setEnd("");
    setError(null);
  };

  const choosePreset = (slot: string) => {
    // Tapping the selected preset again clears it, as long as a custom slot remains
    const next = preset === slot && custom.length > 0 ? null : slot;
    onChange(joinAvailability(next, custom));
  };

  const addSlot = () => {
    setError(null);
    if (!date) return setError("Please choose a date.");
    if (date < todayISO()) return setError("Please choose today or a future date.");
    if (end && !start) return setError("Please add a start time too.");
    if (start && end && end <= start) return setError("The end time must be after the start time.");
    const slot = formatCustomSlot(date, start || undefined, end || undefined);
    if (custom.includes(slot)) return setError("You've already added this time.");
    if (custom.length >= MAX_CUSTOM_SLOTS) return setError(`You can add up to ${MAX_CUSTOM_SLOTS} specific times.`);
    onChange(joinAvailability(preset, [...custom, slot]));
    resetForm();
    setAdding(false);
  };

  // Removing the last specific time falls back to "Flexible" (see joinAvailability)
  const removeSlot = (slot: string) => onChange(joinAvailability(preset, custom.filter((s) => s !== slot)));

  const inputClass =
    "h-11 w-full rounded-lg border-2 border-input bg-background px-3 text-sm font-medium text-foreground transition-colors focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

  return (
    <div className="space-y-3">
      {/* General presets */}
      <div
        role="radiogroup"
        aria-label="Availability"
        className={`grid gap-2.5 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3"}`}
      >
        {AVAILABILITY.map((slot) => {
          const selected = preset === slot;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choosePreset(slot)}
              className={`flex items-center justify-between gap-2 rounded-xl border-2 px-4 text-left text-sm font-bold transition-all duration-200 ${
                compact ? "min-h-[44px] py-2" : "min-h-[48px] py-2.5"
              } ${
                selected
                  ? "border-primary bg-primary/5 text-primary shadow-soft"
                  : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/60"
              }`}
            >
              {slot}
              {selected && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}

        {/* The new button: add a specific date & time */}
        {!adding && custom.length < MAX_CUSTOM_SLOTS && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`group flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.03] px-4 text-sm font-bold text-primary transition-all duration-200 hover:border-primary hover:bg-primary/[0.07] ${
              compact ? "min-h-[44px] py-2" : "min-h-[48px] py-2.5"
            }`}
            aria-expanded={adding}
          >
            <CalendarPlus className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            Add a specific date &amp; time
          </button>
        )}
      </div>

      {/* Custom slots */}
      {custom.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Specific dates and times">
          {custom.map((slot) => (
            <li
              key={slot}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#315B4B]/25 bg-[#315B4B]/10 py-1 pl-3 pr-1 text-sm font-semibold text-[#315B4B] animate-in fade-in zoom-in-95"
            >
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span>{slot}</span>
              <button
                type="button"
                onClick={() => removeSlot(slot)}
                className="rounded-full p-1 transition-colors hover:bg-[#315B4B]/15"
                aria-label={`Remove ${slot}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      {adding && (
        <div className="space-y-3 rounded-xl border-2 border-primary/25 bg-primary/[0.03] p-4 animate-in fade-in slide-in-from-top-1">
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CalendarPlus className="h-4 w-4 text-primary" />
            Add a specific date &amp; time
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-date`} className="text-xs font-bold text-muted-foreground">
                Date (day / month / year)
              </label>
              <input id={`${idPrefix}-date`} type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-start`} className="text-xs font-bold text-muted-foreground">
                From (optional)
              </label>
              <input id={`${idPrefix}-start`} type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-end`} className="text-xs font-bold text-muted-foreground">
                Until (optional)
              </label>
              <input id={`${idPrefix}-end`} type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </div>
          </div>
          {date && !error && (
            <p className="text-xs text-muted-foreground">
              Will show as: <span className="font-bold text-foreground">{formatCustomSlot(date, start || undefined, end || undefined)}</span>
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={addSlot} className="gap-1.5 font-bold">
              <Plus className="h-4 w-4" /> Add time
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
