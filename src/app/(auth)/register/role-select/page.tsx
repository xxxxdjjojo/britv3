"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Key, Building2, Briefcase, Wrench, Check } from "lucide-react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

type RoleCard = {
  id: UserRole;
  icon: React.ElementType;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
};

const TOP_ROW_ROLES: RoleCard[] = [
  {
    id: "homebuyer" as UserRole,
    icon: Home,
    label: "I'm looking to Buy or Rent",
    description: "Access off-market listings and premium property insights tailored to your search.",
    iconBg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
  },
  {
    id: "seller" as UserRole,
    icon: Key,
    label: "I'm looking to Sell",
    description: "Discreetly list your property to verified high-intent buyers without public listing fees.",
    iconBg: "bg-brand-secondary-light",
    iconColor: "text-brand-secondary",
  },
];

const BOTTOM_ROW_ROLES: RoleCard[] = [
  {
    id: "landlord" as UserRole,
    icon: Building2,
    label: "I'm a Landlord",
    description: "Manage portfolios and connect with vetted tenants instantly.",
    iconBg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
  },
  {
    id: "agent" as UserRole,
    icon: Briefcase,
    label: "I'm an Estate Agent",
    description: "Scale your brokerage with our exclusive off-market network.",
    iconBg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
  },
  {
    id: "service_provider" as UserRole,
    icon: Wrench,
    label: "I'm a Tradesperson",
    description: "Join our certified network for property maintenance and renovation projects.",
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
  },
];

const CONSUMER_ROLES: UserRole[] = ["homebuyer", "seller"];

export default function RoleSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setError(null);

    // Consumer roles go straight to the registration form
    if (CONSUMER_ROLES.includes(selected)) {
      router.push(`/register?role=${selected}`);
      return;
    }

    // Professional roles: assign role via Supabase then go to onboarding
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/register?professional=${selected}`);
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: selected });

    if (insertError && !insertError.message.includes("duplicate")) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_role: selected })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push(`/register/onboarding/${selected}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-surface overflow-y-auto">
      {/* Logo */}
      <header className="flex shrink-0 justify-center px-6 pt-10">
        <AuthLogo />
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[860px] space-y-8">
          {/* Heading */}
          <div className="text-center">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
              Join The Invisible Estate
            </h1>
            <p className="mt-2 font-sans text-sm text-neutral-500">
              How would you like to use The Invisible Estate?
            </p>
          </div>

          {error && (
            <div
              className="rounded-xl border border-error/10 bg-error-light px-4 py-3 text-sm text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Top row — 2 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOP_ROW_ROLES.map((role) => (
              <RoleCardButton
                key={role.id}
                role={role}
                isSelected={selected === role.id}
                onSelect={setSelected}
              />
            ))}
          </div>

          {/* Bottom row — 3 smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BOTTOM_ROW_ROLES.map((role) => (
              <RoleCardButton
                key={role.id}
                role={role}
                isSelected={selected === role.id}
                onSelect={setSelected}
              />
            ))}
          </div>

          {/* Continue button */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || loading}
              className="w-full max-w-[460px] rounded-2xl bg-brand-primary px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Setting up your account…" : "Continue →"}
            </button>

            <p className="text-center font-sans text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 flex-col items-center gap-2 px-6 pb-10 text-center">
        <p className="font-sans text-xs text-neutral-400">
          © 2024 Britestate. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <Link
            href="/security"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Security
          </Link>
        </div>
      </footer>
    </div>
  );
}

type RoleCardButtonProps = Readonly<{
  role: RoleCard;
  isSelected: boolean;
  onSelect: (id: UserRole) => void;
}>;

function RoleCardButton({ role, isSelected, onSelect }: RoleCardButtonProps) {
  const Icon = role.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className={[
        "relative w-full rounded-2xl bg-white p-6 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
        isSelected
          ? "ring-2 ring-brand-primary bg-brand-primary/5"
          : "ring-1 ring-neutral-100",
      ].join(" ")}
      aria-pressed={isSelected}
    >
      {/* Checkmark badge */}
      {isSelected && (
        <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-brand-primary">
          <Check className="size-3 text-white" strokeWidth={3} />
        </span>
      )}

      {/* Icon */}
      <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${role.iconBg}`}>
        <Icon className={`size-6 ${role.iconColor}`} strokeWidth={1.75} />
      </div>

      {/* Text */}
      <p className="font-sans text-sm font-semibold text-neutral-900">{role.label}</p>
      <p className="mt-1 font-sans text-sm text-neutral-500 leading-snug">{role.description}</p>
    </button>
  );
}
