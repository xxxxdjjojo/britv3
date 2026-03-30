"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserCircle, Search, Bell, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TO_ROUTE } from "@/lib/constants";

const ONBOARDING_STEPS = [
  {
    icon: UserCircle,
    title: "Complete your profile",
    description:
      "Add your preferences and details so we can personalise your experience on Britestate.",
  },
  {
    icon: Search,
    title: "Explore the market",
    description:
      "Search thousands of UK properties, browse area guides, and discover sold prices near you.",
  },
  {
    icon: Bell,
    title: "Set up alerts",
    description:
      "Create saved searches and get instant notifications when new properties match your criteria.",
  },
];

export default function WelcomePage() {
  const [onboardingUrl, setOnboardingUrl] = useState("/dashboard");
  const [displayName, setDisplayName] = useState("");
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_role, full_name, first_name")
          .eq("id", user.id)
          .single();
        if (profile?.active_role) {
          const slug =
            ROLE_TO_ROUTE[profile.active_role as keyof typeof ROLE_TO_ROUTE] ??
            profile.active_role;
          setOnboardingUrl(`/register/onboarding/${slug}`);
          setRoleName(
            profile.active_role
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          );
        }
        const name =
          profile?.first_name ??
          profile?.full_name?.split(" ")[0] ??
          user.email?.split("@")[0] ??
          "";
        setDisplayName(name);
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary-lighter">
            <CheckCircle className="size-8 text-brand-primary" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
            {displayName ? `Welcome, ${displayName}!` : "Welcome to Britestate!"}
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Your account is ready. Here&apos;s how to get started on your property journey.
          </p>
        </div>
      </div>

      {/* Onboarding steps */}
      <div className="space-y-3">
        {ONBOARDING_STEPS.map(({ icon: Icon, title, description }, index) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-5 py-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter">
              <Icon className="size-5 text-brand-primary" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-semibold uppercase tracking-widest text-brand-primary/60">
                  Step {index + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-900">{title}</p>
              <p className="text-xs leading-relaxed text-neutral-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary-light"
          aria-label="Start setting up your profile"
        >
          <Link href={onboardingUrl}>
            {roleName ? `Set Up Your ${roleName} Profile` : "Start Onboarding"}
            <ArrowRight className="ml-auto size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          aria-label="Explore properties without completing setup"
        >
          <Link href="/search">I&apos;ll explore on my own for now</Link>
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-neutral-400">
        You can always complete your profile later from your dashboard settings.
      </p>
    </div>
  );
}
