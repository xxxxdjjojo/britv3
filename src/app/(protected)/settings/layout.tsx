"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield, Bell, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
    label: "Profile",
    href: "/settings/account",
    icon: User,
  },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back to dashboard */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 font-body text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-6 font-heading text-2xl font-bold text-neutral-900 dark:text-white">
        Settings
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Side navigation -- tabs on desktop, horizontal scroll on mobile */}
        <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
          {SETTINGS_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.disabled ? "#" : tab.href}
                aria-disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 font-body text-sm transition-colors",
                  isActive
                    ? "bg-brand-primary/10 font-medium text-brand-primary"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
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

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
