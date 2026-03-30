import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RightPanelContent } from "@/components/auth/RightPanelContent";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Server-side auth check: redirect authenticated users to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Left panel — form side */}
      <div className="flex w-full flex-col overflow-y-auto px-6 py-10 md:w-[48%] md:px-12 lg:px-16">
        {/* Logo */}
        <Link href="/" aria-label="Britestate home" className="mb-10 flex shrink-0 items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary shadow-sm">
            <span className="font-heading text-sm font-bold text-white">B</span>
          </div>
          <span className="font-heading text-xl font-bold text-neutral-900">
            Britestate
          </span>
        </Link>

        {/* Page content — centred vertically */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="w-full max-w-[460px]">{children}</div>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex items-center gap-4">
          <Link href="/privacy" className="font-body text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-body text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Terms
          </Link>
          <Link href="/help" className="font-body text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Help
          </Link>
        </div>
      </div>

      {/* Right panel — 52% on desktop only */}
      <div className="hidden md:block md:w-[52%]">
        <RightPanelContent />
      </div>
    </div>
  );
}
