"use client";

import { ChevronUp } from "lucide-react";

export function BackToTopButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      Back to top
      <span className="flex size-7 items-center justify-center rounded-full bg-neutral-800">
        <ChevronUp className="size-4" />
      </span>
    </button>
  );
}
