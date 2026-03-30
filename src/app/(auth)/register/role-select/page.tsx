"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { PROFESSIONAL_ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

export default function RoleSelectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRolesSelected(roles: UserRole[]) {
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const role = roles[0];
      router.push(`/register?professional=${role}`);
      return;
    }

    setLoading(true);

    const role = roles[0];

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });

    if (insertError && !insertError.message.includes("duplicate")) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_role: role })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push(`/register/onboarding/${role}`);
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
          Join Britestate
        </h1>
        <p className="mt-2 font-sans text-sm text-neutral-500 max-w-xs mx-auto">
          Select your role to get the experience that&apos;s right for you
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <RoleSelector
        onSubmit={handleRolesSelected}
        loading={loading}
        roles={PROFESSIONAL_ROLES}
        singleSelect
      />

      <p className="text-center font-sans text-sm text-neutral-500">
        Not a professional?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors"
          aria-label="Sign up as a homebuyer or renter"
        >
          Sign up as a homebuyer
        </Link>
      </p>
    </div>
  );
}
