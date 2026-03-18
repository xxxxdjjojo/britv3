// src/components/pricing/BillingToggle.tsx
"use client";

// [ENG REVIEW 6A] — savingsLabel is dynamic per-tab, computed by PricingTabs
// from actual plan prices. Avoids hardcoding "Save 2 months" which is only
// accurate for provider plans (agent/landlord save ~2.4 months).
type Props = Readonly<{
  annual: boolean;
  onToggle: (annual: boolean) => void;
  savingsLabel: string;
}>;

export function BillingToggle({ annual, onToggle, savingsLabel }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium ${!annual ? "text-neutral-900" : "text-neutral-500"}`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label="Toggle annual billing"
        onClick={() => onToggle(!annual)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          annual ? "bg-[#1B4D3E]" : "bg-neutral-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
            annual ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${annual ? "text-neutral-900" : "text-neutral-500"}`}
      >
        Annual
        <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          {savingsLabel}
        </span>
      </span>
    </div>
  );
}
