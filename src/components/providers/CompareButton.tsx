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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1B4D3E] text-white hover:bg-[#1B4D3E]/80 transition-colors"
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        <CheckCheck className="w-3 h-3" /> Compare Full
      </button>
    );
  }

  return (
    <button
      onClick={() => add(providerId)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:border-[#1B4D3E] hover:text-[#1B4D3E] transition-colors"
      aria-label={`Add ${providerName} to comparison`}
    >
      <GitCompareArrows className="w-3 h-3" /> Compare
    </button>
  );
}

export default CompareButton;
