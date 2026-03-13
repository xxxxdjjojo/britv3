"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
    >
      <Download className="size-4" /> Print / Save as PDF
    </button>
  );
}
