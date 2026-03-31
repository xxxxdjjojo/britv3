"use client";

import { useCompare } from "@/components/compare/useCompare";
import { GitCompareArrows, X, CheckCheck } from "lucide-react";

export function CompareButton({
  providerId,
  providerName,
}: Readonly<{ providerId: string; providerName: string }>) {
  const { add, remove, has, isFull } = useCompare();
  const isAdded = has(providerId);

  if (isAdded) {
    return (
      <button
        onClick={() => remove(providerId)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-primary text-white hover:bg-brand-primary/80 transition-colors min-h-[44px]"
        aria-label={`Remove ${providerName} from comparison`}
      >
        <X className="w-3 h-3" /> Remove from Compare
      </button>
    );
  }

  if (isFull) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-container-low text-brand-primary/30 cursor-not-allowed min-h-[44px]"
      >
        <CheckCheck className="w-3 h-3" /> Compare Full
      </button>
    );
  }

  return (
    <button
      onClick={() => add(providerId)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-container-low text-brand-primary hover:bg-surface-container transition-colors min-h-[44px]"
      aria-label={`Add ${providerName} to comparison`}
    >
      <GitCompareArrows className="w-3 h-3" /> Compare
    </button>
  );
}

export default CompareButton;
