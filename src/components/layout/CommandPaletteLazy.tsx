"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () => import("@/components/layout/CommandPalette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false },
);

export function CommandPaletteLazy() {
  return <CommandPalette />;
}
