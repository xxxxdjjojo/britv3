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
    <div className="flex min-h-screen">
      {/* Left panel — 44% on desktop, full width on mobile */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-[44%] md:px-12 lg:px-16">
        {/* Logo */}
        <Link href="/" className="mb-10 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary">
            <span className="font-heading text-base font-bold text-white">B</span>
          </div>
          <span className="font-heading text-xl font-bold text-neutral-900">
            Britestate
          </span>
        </Link>

        {/* Page content */}
        <div className="w-full max-w-[420px]">{children}</div>
      </div>

      {/* Right panel — 56% on desktop only */}
      <div className="hidden md:block md:w-[56%]">
        <RightPanelContent />
      </div>
    </div>
  );
}
