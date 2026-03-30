import type { ReactNode } from "react";
import Link from "next/link";
import { RightPanelContent } from "@/components/auth/RightPanelContent";

export default function PostAuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — 44% on desktop, full width on mobile */}
      <div className="flex w-full flex-col justify-center overflow-y-auto px-6 py-12 md:w-[44%] md:px-12 lg:px-16">
        {/* Logo */}
        <Link href="/" className="mb-10 flex shrink-0 items-center gap-2" aria-label="Britestate home">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary">
            <span className="font-heading text-base font-bold text-white">B</span>
          </div>
          <span className="font-heading text-xl font-bold text-neutral-900">
            Britestate
          </span>
        </Link>

        {/* Page content */}
        <div className="w-full max-w-[480px]">{children}</div>
      </div>

      {/* Right panel — 56% on desktop only */}
      <div className="hidden md:block md:w-[56%]">
        <RightPanelContent />
      </div>
    </div>
  );
}
