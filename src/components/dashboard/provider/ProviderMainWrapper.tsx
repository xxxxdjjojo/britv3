"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ProviderMainWrapper({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isFieldView = pathname.startsWith("/dashboard/provider/field");

  return (
    <main
      className={`flex-1 overflow-auto p-4 sm:p-6 ${
        isFieldView ? "" : "lg:pl-72 lg:pr-8 lg:py-8"
      }`}
    >
      {children}
    </main>
  );
}
