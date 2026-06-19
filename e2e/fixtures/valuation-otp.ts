import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Local Supabase admin helpers for the valuation E2E. Mints a genuine email OTP
 * via generateLink (no inbox scraping) and cleans up the created user. Requires
 * LOCAL_SUPABASE_URL + LOCAL_SUPABASE_SERVICE in the environment.
 */
function admin(): SupabaseClient {
  const url = process.env.LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const service = process.env.LOCAL_SUPABASE_SERVICE ?? "";
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MailpitMsg = { ID: string; To: { Address: string }[]; Created: string; Snippet: string };

/**
 * Read the genuine 6-digit OTP that Supabase emailed (via local Mailpit) — the
 * real code the user would receive, not a separately-minted one. Polls until the
 * message for `since` arrives.
 */
export async function readLatestOtp(email: string, since = Date.now()): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${MAILPIT}/api/v1/messages?limit=50`).catch(() => null);
    if (res?.ok) {
      const body = (await res.json()) as { messages: MailpitMsg[] };
      const match = body.messages
        .filter((m) => m.To.some((t) => t.Address.toLowerCase() === email.toLowerCase()))
        .filter((m) => new Date(m.Created).getTime() >= since - 2000)
        .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime())[0];
      const code = match?.Snippet.match(/code:\s*(\d{6})/i)?.[1] ?? match?.Snippet.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await sleep(1000);
  }
  throw new Error(`readLatestOtp: no OTP email found for ${email}`);
}

/** Delete all Mailpit messages (call before a send to scope readLatestOtp). */
export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" }).catch(() => undefined);
}

export async function findUserByEmail(email: string) {
  const { data } = await admin().auth.admin.listUsers();
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function deleteUserByEmail(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (user) await admin().auth.admin.deleteUser(user.id).catch(() => undefined);
}

/** Query consent events for a user (to assert marketing separation). */
export async function consentPurposesForUser(userId: string): Promise<string[]> {
  const { data } = await admin()
    .from("valuation_consent_events")
    .select("purpose")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.purpose as string);
}

export async function agentLeadCountForUser(userId: string): Promise<number> {
  const { count } = await admin()
    .from("valuation_agent_leads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}
