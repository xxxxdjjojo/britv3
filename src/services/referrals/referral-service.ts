/**
 * Referral service.
 * Handles referral code creation and conversion tracking.
 * All functions accept a Supabase client as first parameter for testability.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ReferralCode = {
  id: string;
  code: string;
  created_at: string;
};

export type ReferralConversion = {
  id: string;
  referred_id: string;
  code_used: string;
  converted_at: string;
  status: "pending" | "converted";
};

export type ReferralStats = {
  referral_code: ReferralCode | null;
  referral_url: string;
  total_referrals: number;
  converted: number;
  pending: number;
  conversions: ReferralConversion[];
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://britestate.co.uk";

/**
 * Get the referral code for a user, or null if none exists.
 */
export async function getReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralCode | null> {
  const { data, error } = await supabase
    .from("referral_codes")
    .select("id, code, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get referral code: ${error.message}`);
  }

  return data as ReferralCode | null;
}

/**
 * Create a referral code for a user.
 * Uses the first 8 chars of the userId (uppercased) as the base.
 * If that code is already taken (unique constraint), appends a random 4-char suffix.
 */
export async function createReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralCode> {
  const baseCode = userId.slice(0, 8).toUpperCase();

  // Try base code first
  const { data, error } = await supabase
    .from("referral_codes")
    .insert({ user_id: userId, code: baseCode })
    .select("id, code, created_at")
    .single();

  if (!error) {
    return data as ReferralCode;
  }

  // If unique constraint violation on code, try with a random suffix
  if (error.code === "23505") {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const fallbackCode = `${baseCode}${suffix}`;

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("referral_codes")
      .insert({ user_id: userId, code: fallbackCode })
      .select("id, code, created_at")
      .single();

    if (fallbackError) {
      // user_id unique constraint — code already exists for this user, fetch it
      if (fallbackError.code === "23505") {
        const existing = await getReferralCode(supabase, userId);
        if (existing) return existing;
      }
      throw new Error(`Failed to create referral code: ${fallbackError.message}`);
    }

    return fallbackData as ReferralCode;
  }

  throw new Error(`Failed to create referral code: ${error.message}`);
}

/**
 * Get full referral stats for a user.
 * If the user has no referral code, the code and URL will reflect null / empty URL.
 */
export async function getReferralStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReferralStats> {
  const [codeResult, conversionsResult] = await Promise.all([
    getReferralCode(supabase, userId),
    supabase
      .from("referral_conversions")
      .select("id, referred_id, code_used, converted_at, status")
      .eq("referrer_id", userId)
      .order("converted_at", { ascending: false }),
  ]);

  const conversions = ((conversionsResult.data ?? []) as ReferralConversion[]);

  const referral_url = codeResult
    ? `${SITE_URL}/join?ref=${codeResult.code}`
    : "";

  return {
    referral_code: codeResult,
    referral_url,
    total_referrals: conversions.length,
    converted: conversions.filter((c) => c.status === "converted").length,
    pending: conversions.filter((c) => c.status === "pending").length,
    conversions,
  };
}
