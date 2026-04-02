"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DeletionPendingBanner } from "@/components/auth/DeletionPendingBanner";
import type { ReactNode } from "react";

/** Routes that render their own sidebar — skip the generic one. */
const CUSTOM_SIDEBAR_PREFIXES = [
  "/dashboard/provider",
  "/dashboard/seller",
  "/dashboard/broker",
];

export function DashboardShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const hasCustomSidebar = CUSTOM_SIDEBAR_PREFIXES.some((p) => pathname.startsWith(p));

  if (hasCustomSidebar) {
    return (
      <>
        <DeletionPendingBanner />
        {children}
      </>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
        <DeletionPendingBanner />
        {children}
      </main>
    </div>
  );
}
