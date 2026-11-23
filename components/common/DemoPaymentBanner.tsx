import { Coins } from "lucide-react";
import { DEMO_PAYMENT_BANNER } from "@/lib/constants";

export function DemoPaymentBanner({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Demo payment disclaimer"
      className={`flex items-start sm:items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-900 ${
        className || ""
      }`}
    >
      <Coins className="h-5 w-5 flex-shrink-0 text-blue-600" />
      <span>{DEMO_PAYMENT_BANNER}</span>
    </div>
  );
}
