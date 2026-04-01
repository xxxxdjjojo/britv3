"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield, Bell, Lock, User, Settings2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SecurityScoreBadge } from "@/components/settings/SecurityScoreBadge";
import { PrivacyShieldBadge } from "@/components/settings/PrivacyShieldBadge";

type SettingsTab = Readonly<{
  label: string;
  href: string;
  icon: typeof Shield;
  disabled?: boolean;
}>;

const SETTINGS_TABS: readonly SettingsTab[] = [
  {
    label: "Privacy & Data",
    href: "/settings/privacy",
    icon: Shield,
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: Lock,
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    label: "Email",
    href: "/settings/email-subscriptions",
    icon: Mail,
  },
  {
    label: "Account",
    href: "/settings/account",
    icon: User,
  },
  {
    label: "Preferences",
    href: "/settings/preferences",
    icon: Settings2,
  },
];

// ---------------------------------------------------------------------------
// Badge data types
// ---------------------------------------------------------------------------

type SecurityData = Readonly<{
  hasPassword: boolean;
  hasMfa: boolean;
  hasConnectedAccount: boolean;
  recentPasswordChange: boolean;
}>;

type PrivacyData = Readonly<{
  visibility: "public" | "registered_only" | "private";
  searchIndexing: boolean;
  thirdPartyMarketing: boolean;
  activeStatus: boolean;
}>;

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function BadgeSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="size-8 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-14 rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-2.5 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [privacyData, setPrivacyData] = useState<PrivacyData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBadgeData() {
      const supabase = createClient();

      // Fetch identities, MFA factors, and privacy in parallel
      const [identitiesRes, mfaRes, privacyRes] = await Promise.allSettled([
        fetch("/api/settings/connected").then((r) => r.json()),
        supabase.auth.mfa.listFactors(),
        fetch("/api/settings/privacy").then((r) => r.json()),
      ]);

      if (cancelled) return;

      // --- Security badge ---
      if (identitiesRes.status === "fulfilled") {
        const identities: Array<{ provider: string; updated_at?: string }> =
          identitiesRes.value?.identities ?? [];
        const emailIdentity = identities.find((i) => i.provider === "email");
        const oauthIdentity = identities.find((i) => i.provider !== "email");
        const recentChange = emailIdentity?.updated_at
          ? Date.now() - new Date(emailIdentity.updated_at).getTime() < NINETY_DAYS_MS
          : false;

        const hasMfa =
          mfaRes.status === "fulfilled" && mfaRes.value.data
            ? mfaRes.value.data.totp.some((f) => f.status === "verified")
            : false;

        setSecurityData({
          hasPassword: !!emailIdentity,
          hasMfa,
          hasConnectedAccount: !!oauthIdentity,
          recentPasswordChange: recentChange,
        });
      }

      // --- Privacy badge ---
      if (privacyRes.status === "fulfilled") {
        const data = privacyRes.value;
        setPrivacyData({
          visibility: data?.visibility ?? "public",
          searchIndexing: data?.search_indexing ?? false,
          thirdPartyMarketing: data?.third_party_marketing ?? false,
          activeStatus: data?.active_status ?? true,
        });
      }
    }

    fetchBadgeData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back to dashboard */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 font-body text-sm text-neutral-500 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight text-foreground">
        Settings
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Side navigation -- tabs on desktop, horizontal scroll on mobile */}
        <div className="lg:w-56 lg:shrink-0">
          <div className="relative lg:static">
            <nav className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
              {SETTINGS_TABS.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.disabled ? "#" : tab.href}
                    aria-disabled={tab.disabled}
                    tabIndex={tab.disabled ? -1 : undefined}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 font-body text-sm transition-colors",
                      isActive
                        ? "bg-brand-primary/10 font-medium text-brand-primary"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-foreground",
                      tab.disabled &&
                        "pointer-events-none cursor-not-allowed opacity-40",
                    )}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {tab.disabled && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            {/* Right fade gradient hinting at horizontal scroll — mobile only */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent lg:hidden" />
          </div>

          {/* Security & Privacy Badges — desktop only */}
          <div className="mt-4 hidden space-y-2 lg:block">
            {securityData ? (
              <SecurityScoreBadge {...securityData} />
            ) : (
              <BadgeSkeleton />
            )}
            {privacyData ? (
              <PrivacyShieldBadge {...privacyData} />
            ) : (
              <BadgeSkeleton />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
