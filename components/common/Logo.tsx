import { cn } from "@/lib/utils";

/**
 * Musubi（結び, "tying together"）brand mark: two loops tied into one knot —
 * terracotta for the older generation's wisdom, green for the younger
 * generation's energy. Each loop passes over the other once, like a real cord.
 * The same drawing lives in public/brand/*.svg and app/icon.svg.
 */
export const BRAND = { older: "#B4441A", younger: "#3F7356" } as const;

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        {/* Cut the green loop where the terracotta loop crosses over it */}
        <mask id="musubi-over" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <path d="M26.43 18.21A14 14 0 0 1 36.12 25" fill="none" stroke="#000" strokeWidth="14" strokeLinecap="round" />
        </mask>
      </defs>
      <circle cx="24" cy="32" r="14" fill="none" stroke={BRAND.older} strokeWidth="8" />
      <circle cx="40" cy="32" r="14" fill="none" stroke={BRAND.younger} strokeWidth="8" mask="url(#musubi-over)" />
    </svg>
  );
}

/** Mark + "Musubi" wordmark (+ optional 結び). */
export function Logo({
  className,
  size = "md",
  showKanji = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showKanji?: boolean;
}) {
  const mark = { sm: "h-7 w-7", md: "h-8 w-8 sm:h-9 sm:w-9", lg: "h-12 w-12" }[size];
  const word = { sm: "text-lg", md: "text-[21px] sm:text-[26px]", lg: "text-4xl" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)} data-no-translate>
      <LogoMark className={mark} />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className={cn("font-black tracking-tight text-foreground", word)}>Musubi</span>
        {showKanji && <span className="text-xs font-bold text-primary/80 sm:text-sm">結び</span>}
      </span>
    </span>
  );
}
