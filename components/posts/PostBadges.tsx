import { ArrowLeftRight, Coins, Gift, HandHelping, Sparkles } from "lucide-react";
import type { ExchangeMethod, PostType } from "@/lib/types";
import { money } from "@/lib/utils";

const EXCHANGE_STYLES: Record<ExchangeMethod, { icon: typeof Gift; className: string; label: string }> = {
  free: { icon: Gift, className: "text-emerald-800 bg-emerald-50 border-emerald-200", label: "Free" },
  exchange: { icon: ArrowLeftRight, className: "text-[#234336] bg-[#E7EEE4] border-[#315B4B]/30", label: "Skill Exchange" },
  paid: { icon: Coins, className: "text-amber-800 bg-amber-50 border-amber-200", label: "Paid" },
};

/** Small pill describing how a post is exchanged (free / skill swap / paid demo). */
export function ExchangeBadge({
  method,
  amount,
  className = "",
}: {
  method: ExchangeMethod;
  amount?: number | null;
  className?: string;
}) {
  const style = EXCHANGE_STYLES[method];
  if (!style) return null;
  const Icon = style.icon;
  const label = method === "paid" ? `${amount ? money(amount) : style.label} (Demo)` : style.label;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] sm:text-xs font-bold whitespace-nowrap ${style.className} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

export const POST_TYPE_ACCENT: Record<PostType, string> = {
  request: "bg-[#2563eb]",
  offer: "bg-primary",
};

/** Pill showing whether a post is an offer or a request for help. */
export function PostTypeBadge({ type }: { type: PostType }) {
  const isOffer = type === "offer";
  const Icon = isOffer ? Sparkles : HandHelping;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider border ${
        isOffer ? "bg-orange-50 text-primary border-primary/30" : "bg-blue-50 text-blue-800 border-blue-300"
      }`}
    >
      <Icon className={`h-3 w-3 ${isOffer ? "text-primary" : "text-blue-600"}`} />
      {isOffer ? "Offer" : "Request"}
    </span>
  );
}
