// src/app/(main)/fee-transparency/page.tsx — Memo Pivot v2: public commission table.
//
// Phase-4 placeholder; full content shipped in Phase 5.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fee Transparency | Britestate",
  description: "Every commission rate, every segment, every tier. Build trust by showing the maths.",
};

export default function FeeTransparencyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
        Fee Transparency
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Every commission rate across all seven Britestate segments.
      </p>
    </div>
  );
}
