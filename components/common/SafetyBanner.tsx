import { ShieldAlert } from "lucide-react";
import { SAFETY_TEXT } from "@/lib/constants";

export function SafetyBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Safety advice"
      className={`flex items-start sm:items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${
        className || ""
      }`}
    >
      <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-700" />
      <span className="font-medium">{SAFETY_TEXT}</span>
    </div>
  );
}
