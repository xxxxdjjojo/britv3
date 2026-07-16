import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SafePublicVouchedProfile = Readonly<{
  businessName: string;
  slug: string;
  attributions: readonly Readonly<{
    firstName: string;
    role: string;
    acceptedAt: string;
  }>[];
}>;

type AttributionRow = Readonly<{
  voucher_kind: "peer" | "client";
  voucher_trade: string | null;
  accepted_at: string;
  profiles: { display_name: string | null } | null;
}>;

function firstName(displayName: string | null): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || null;
}

/**
 * Server-only public-card loader. The service-role client proves raw 3+3
 * completion, then returns an explicit allowlist containing only attribution
 * fields for which the voucher consented.
 */
export async function getSafePublicVouchedProfile(
  slug: string,
): Promise<SafePublicVouchedProfile | null> {
  const admin = createAdminClient();
  const { data: provider, error: providerError } = await admin
    .from("service_provider_details")
    .select("user_id, business_name, slug")
    .eq("slug", slug)
    .single();

  if (providerError || !provider) return null;

  const providerRow = provider as {
    user_id: string;
    business_name: string;
    slug: string;
  };
  const activeVouches = () => admin
    .from("vouches")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerRow.user_id)
    .is("revoked_at", null);

  const [peerResult, clientResult] = await Promise.all([
    activeVouches().eq("voucher_kind", "peer"),
    activeVouches().eq("voucher_kind", "client"),
  ]);

  if (
    peerResult.error
    || clientResult.error
    || (peerResult.count ?? 0) < 3
    || (clientResult.count ?? 0) < 3
  ) {
    return null;
  }

  const { data, error } = await admin
    .from("vouches")
    .select(
      "voucher_kind, voucher_trade, accepted_at, profiles!vouches_voucher_profile_id_fkey(display_name)",
    )
    .eq("provider_id", providerRow.user_id)
    .is("revoked_at", null)
    .eq("public_attribution_consent", true)
    .order("accepted_at", { ascending: true });

  if (error) return null;

  const attributions = ((data ?? []) as unknown as AttributionRow[]).flatMap((row) => {
    const name = firstName(row.profiles?.display_name ?? null);
    if (!name) return [];
    return [{
      firstName: name,
      role: row.voucher_kind === "client" ? "Client" : (row.voucher_trade?.trim() || "Service provider"),
      acceptedAt: row.accepted_at,
    }];
  });

  return {
    businessName: providerRow.business_name,
    slug: providerRow.slug,
    attributions,
  };
}
