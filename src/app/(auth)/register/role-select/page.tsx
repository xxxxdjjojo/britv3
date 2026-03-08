"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleSelector } from "@/components/auth/RoleSelector";
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
      setError("You must be logged in to select roles.");
      setLoading(false);
      return;
    }

    const uniqueRoles = [...new Set(roles)];

    // Insert roles into user_roles table
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert(uniqueRoles.map((role) => ({ user_id: user.id, role })));

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Set first selected role as active
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_role: uniqueRoles[0] })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Navigate to onboarding for the first selected role
    router.push(`/register/onboarding/${uniqueRoles[0]}`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          How will you use Britestate?
        </h1>
        <p className="mt-2 text-neutral-500">
          Select all that apply. You can add more roles later.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <RoleSelector onSubmit={handleRolesSelected} loading={loading} />
    </div>
  );
}
