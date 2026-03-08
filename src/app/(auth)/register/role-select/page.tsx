"use client";

export const dynamic = "force-dynamic";

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
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not logged in yet — store selection and redirect to register
      const role = roles[0];
      router.push(`/register?professional=${role}`);
      return;
    }

    const role = roles[0];

    // Insert role into user_roles table
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });

    if (insertError && !insertError.message.includes("duplicate")) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Set as active role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_role: role })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Navigate to onboarding for the selected role
    router.push(`/register/onboarding/${role}`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome to Britestate
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Select your professional type
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <RoleSelector
        onSubmit={handleRolesSelected}
        loading={loading}
        roles={PROFESSIONAL_ROLES}
        singleSelect
      />

      <p className="text-center font-body text-sm text-neutral-500">
        Not a professional?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign up as a homebuyer
        </Link>
      </p>
    </div>
  );
}
