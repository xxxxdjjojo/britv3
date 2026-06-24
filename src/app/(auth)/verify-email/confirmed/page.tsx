"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TO_ROUTE } from "@/lib/constants";
import { PENDING_SIGNUP_EMAIL_KEY } from "@/lib/auth/signup-confirmation";

export default function VerifyEmailConfirmedPage() {
  const [onboardingUrl, setOnboardingUrl] = useState("/dashboard");
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);

    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_role")
          .eq("id", user.id)
          .single();
        if (profile?.active_role) {
          const slug = ROLE_TO_ROUTE[profile.active_role as keyof typeof ROLE_TO_ROUTE] ?? profile.active_role;
          setOnboardingUrl(`/register/onboarding/${slug}`);
          setRoleName(profile.active_role.replace("_", " "));
        }
      }
    }
    fetchRole();
  }, []);

  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      <div className="flex justify-center">
        <CheckCircle className="size-20 animate-bounce text-success" />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Email Verified!
        </h1>
        <p className="font-body text-base text-neutral-500">
          You&apos;re all set. Your account is ready to use.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" render={<Link href={onboardingUrl} />}>
          {roleName ? `Set Up Your ${roleName.charAt(0).toUpperCase() + roleName.slice(1)} Profile` : "Complete Your Profile"}
        </Button>
        <Button variant="ghost" size="lg" className="w-full" render={<Link href="/search" />}>
          Browse Properties
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <Lock className="size-3" aria-hidden="true" />
          256-bit Encrypted
        </span>
        <span className="text-neutral-300" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden="true" />
          GDPR Compliant
        </span>
        <span className="text-neutral-300" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <MailCheck className="size-3" aria-hidden="true" />
          No Spam
        </span>
      </div>

      <p className="font-body text-sm text-neutral-400">
        Already exploring?{" "}
        <Link href="/search" className="font-medium text-brand-accent hover:underline">
          Browse properties without an account
        </Link>
      </p>
    </div>
  );
}
