"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

export function useRole() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("active_role").eq("id", user.id).single(),
    ]);

    if (rolesResult.data) {
      setRoles(rolesResult.data.map((r: { role: UserRole }) => r.role));
    }

    if (profileResult.data) {
      setActiveRole(profileResult.data.active_role as UserRole);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      await fetchRoles();
      if (!active) return;
    }
    load();
    return () => { active = false; };
  }, [fetchRoles]);

  const switchRole = useCallback(async (role: UserRole): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc("switch_role_atomic", {
      p_user_id: user.id,
      p_role: role,
    });

    if (!error) {
      setActiveRole(role);
      return true;
    }
    return false;
  }, []);

  return { roles, activeRole, loading, switchRole, refetch: fetchRoles };
}
