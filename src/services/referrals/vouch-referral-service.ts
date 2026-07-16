import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ReferralAttributionInput = Readonly<{
  userId: string;
  referralCode?: string;
  inviteToken?: string;
}>;

export async function attributeReferralAfterAuthentication(
  input: ReferralAttributionInput,
): Promise<{ attributed: boolean; outcome: string }> {
  if (!input.referralCode && !input.inviteToken) {
    return { attributed: false, outcome: "no_attribution" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("attribute_referral_signup", {
    p_referred_profile_id: input.userId,
    p_referral_code: input.referralCode ?? null,
    p_invite_token: input.inviteToken ?? null,
  });
  if (error) throw new Error(`Referral attribution failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;
  const outcome = (row as { outcome?: string } | null)?.outcome ?? "no_attribution";
  return { attributed: outcome === "attributed", outcome };
}
