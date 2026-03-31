"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Lock, ShieldCheck, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TO_ROUTE } from "@/lib/constants";
import { AuthLogo } from "@/components/auth/AuthLogo";

export default function VerifyEmailConfirmedPage() {
  const [onboardingUrl, setOnboardingUrl] = useState("/dashboard");
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_role")
          .eq("id", user.id)
          .single();
        if (profile?.active_role) {
          const slug =
            ROLE_TO_ROUTE[profile.active_role as keyof typeof ROLE_TO_ROUTE] ??
            profile.active_role;
          setOnboardingUrl(`/register/onboarding/${slug}`);
          setRoleName(profile.active_role.replace("_", " "));
        }
      }
    }
    fetchRole();
  }, []);

  const displayRole = roleName
    ? roleName.charAt(0).toUpperCase() + roleName.slice(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#f0f4f0] via-white to-[#e8f0ec] px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg text-center md:p-10">
        {/* Logo */}
        <div className="flex justify-center">
          <AuthLogo />
        </div>

        {/* Success icon — dark green rounded-xl square */}
        <div className="flex justify-center">
          <div className="relative flex size-20 items-center justify-center rounded-xl bg-[#1B4D3E]">
            <span className="absolute inline-flex size-full animate-ping rounded-xl bg-[#1B4D3E] opacity-10" />
            <CheckCircle2 className="relative size-10 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Step progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={
                step <= 2
                  ? "h-1.5 w-8 rounded-full bg-brand-primary"
                  : "h-1.5 w-8 rounded-full bg-neutral-200"
              }
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Email verified!
          </h1>
          <p className="font-sans text-base text-neutral-600">
            Your account is ready. Let&apos;s set up your profile to start
            finding your perfect property.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full bg-[#1B4D3E] text-white hover:bg-[#163d31]"
            asChild
            aria-label={
              displayRole
                ? `Continue to set up your ${displayRole} profile`
                : "Continue to onboarding"
            }
          >
            <Link href={onboardingUrl}>
              {displayRole
                ? `Set Up Your ${displayRole} Profile`
                : "Continue to Onboarding"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            asChild
            aria-label="Go to your dashboard instead"
          >
            <Link href="/dashboard">Go to Dashboard instead</Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            256-bit Encrypted
          </span>
          <span className="text-neutral-300" aria-hidden="true">
            &bull;
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            GDPR Compliant
          </span>
          <span className="text-neutral-300" aria-hidden="true">
            &bull;
          </span>
          <span className="flex items-center gap-1.5">
            <MailCheck className="size-3.5 shrink-0" aria-hidden="true" />
            No Spam
          </span>
        </div>

        {/* Step complete label */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#9ca3af]">
          Step 2 of 3 Complete
        </p>
      </div>
    </div>
  );
}
