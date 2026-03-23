import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderIdentity = Readonly<{
  providerId: string;
  userId: string;
  businessName: string;
}>;

/**
 * Resolve the provider identity from the authenticated user.
 * Throws if not authenticated or no provider profile exists.
 * This intentionally does NOT fall back to user.id — that was
 * identified as a security bug in the CEO review.
 */
export async function resolveProviderId(
  supabase: SupabaseClient,
): Promise<ProviderIdentity> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("service_provider_details")
    .select("user_id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("Provider profile not found");
  }

  return {
    providerId: profile.user_id as string,
    userId: user.id,
    businessName: (profile.business_name as string | null) ?? "",
  };
}
