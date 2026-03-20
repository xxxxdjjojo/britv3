"use client";
export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { PROFESSIONAL_ROLES, ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

function RoleSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addRoleParam = searchParams.get("addRole");
  const isAddSellerMode = addRoleParam === "seller";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SELLER_ROLE = ROLES.filter((r) => r.value === "seller");

  async function handleRolesSelected(roles: UserRole[]) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const role = roles[0];
      router.push(`/register?professional=${role}`);
      return;
    }

    const role = roles[0];

    const { error: rpcError } = await supabase.rpc("select_roles_atomic", {
      p_user_id: user.id,
      p_roles: [role],
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push(`/register/onboarding/${role}`);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {isAddSellerMode ? (
          <>
            <h1 className="font-heading text-2xl font-bold text-neutral-900">
              Add Seller Role
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              You can list and sell properties alongside your buyer account
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-neutral-900">
              Welcome to Britestate
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Select your professional type
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <RoleSelector
        onSubmit={handleRolesSelected}
        loading={loading}
        roles={isAddSellerMode ? SELLER_ROLE : PROFESSIONAL_ROLES}
        singleSelect
      />

      {!isAddSellerMode && (
        <p className="text-center font-body text-sm text-neutral-500">
          Not a professional?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-accent hover:underline"
          >
            Sign up as a homebuyer
          </Link>
        </p>
      )}
    </div>
  );
}

export default function RoleSelectPage() {
  return (
    <Suspense>
      <RoleSelectContent />
    </Suspense>
  );
}
