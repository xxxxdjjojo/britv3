"use client";

import type { ReactNode } from "react";
import { ProviderProvider, type ProviderInitialData } from "@/contexts/ProviderContext";

export function ProviderContextWrapper({
  initialData,
  children,
}: {
  initialData: ProviderInitialData;
  children: ReactNode;
}) {
  return <ProviderProvider initialData={initialData}>{children}</ProviderProvider>;
}
