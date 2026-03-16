"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ListingStep } from "@/types/seller";

const STEP_LABELS: Record<ListingStep, string> = {
  1: "Address & Property Type",
  2: "Property Details",
  3: "Photos & Media",
  4: "AI Description",
  5: "Price & Listing Type",
  6: "EPC Upload",
  7: "Review & Publish",
};

type Props = Readonly<{
  step: ListingStep;
  listingId?: string;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}>;

export function WizardShell({
  step,
  listingId,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  isLoading = false,
  children,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalSteps = 7;
  const pct = Math.round((step / totalSteps) * 100);

  const goBack = () => {
    if (onBack) { onBack(); return; }
    if (step > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(step - 1));
      if (listingId) params.set("id", listingId);
      router.push(`/dashboard/seller/listings/create?${params.toString()}`);
    } else {
      router.push("/dashboard/seller/listings");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Stepper */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">
            Step {step} of {totalSteps} — {STEP_LABELS[step]}
          </span>
          <span className="text-sm font-semibold text-[#1B4D3E]">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1B4D3E] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div>{children}</div>

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || isLoading}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-[#1B4D3E]/20",
            continueDisabled || isLoading
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : "bg-[#1B4D3E] hover:bg-[#2D7A5F] active:scale-95",
          )}
        >
          {isLoading ? "Saving..." : continueLabel}
          {!isLoading && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Floating help button */}
      <button
        type="button"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-700 transition-colors z-50"
        title="Need help?"
        aria-label="Help"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5"/>
          <path d="M8 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2v1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="10" cy="14.5" r=".75" fill="white"/>
        </svg>
      </button>
    </div>
  );
}
