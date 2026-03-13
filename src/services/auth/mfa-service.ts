import { createClient } from "@/lib/supabase/client";

export async function enrollMFA() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Britestate",
  });
  return { data, error };
}

export async function createMFAChallenge(factorId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  return { data, error };
}

export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  return { data, error };
}

export async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );

  const supabase = createClient();
  const hashedCodes = await Promise.all(
    codes.map(async (code) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }),
  );

  await supabase
    .from("user_backup_codes")
    .upsert(
      hashedCodes.map((hash) => ({
        user_id: userId,
        code_hash: hash,
        used: false,
      })),
      { onConflict: "user_id,code_hash" },
    );

  return codes;
}
