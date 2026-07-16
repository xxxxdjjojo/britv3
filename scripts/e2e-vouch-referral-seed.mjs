#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const target = new URL(supabaseUrl);
if (!new Set(["localhost", "127.0.0.1", "::1"]).has(target.hostname)) {
  throw new Error(`Refusing to seed non-local Supabase target: ${supabaseUrl}`);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const PASSWORD = "VouchEvidence123!";
const NOW = "2026-07-16T12:00:00.000Z";
const FUTURE = "2099-12-31T23:59:59.000Z";
const PAST = "2026-01-01T00:00:00.000Z";

const providers = [
  { key: "gate_empty", email: "vouch-gate-empty@truedeed.test", name: "Gate Empty Plumbing", slug: "vouch-gate-empty", peer: 0, client: 0, grandfathered: false },
  { key: "gate_3_plus_2", email: "vouch-gate-3-plus-2@truedeed.test", name: "Nearly Vouched Heating", slug: "vouch-gate-3-plus-2", peer: 3, client: 2, grandfathered: false },
  { key: "gate_complete", email: "vouch-gate-complete@truedeed.test", name: "Complete Vouched Electrical", slug: "vouch-gate-complete", peer: 3, client: 3, grandfathered: false },
  { key: "grandfathered", email: "vouch-grandfathered@truedeed.test", name: "Grandfathered Roofing", slug: "vouch-grandfathered", peer: 0, client: 0, grandfathered: true },
];

const peers = Array.from({ length: 3 }, (_, index) => ({
  key: `peer_${index + 1}`,
  email: `vouch-peer-${index + 1}@truedeed.test`,
  name: ["Aisha", "Ben", "Cara"][index],
}));
const clients = Array.from({ length: 5 }, (_, index) => ({
  key: `client_${index + 1}`,
  email: `vouch-client-${index + 1}@truedeed.test`,
  name: ["Dani", "Eli", "Fran", "Gus", "Hana"][index],
}));
const referred = Array.from({ length: 15 }, (_, index) => ({
  key: `referred_${index + 1}`,
  email: `vouch-referred-${index + 1}@truedeed.test`,
  name: `Crew member ${index + 1}`,
}));

function uuid(group, index) {
  return `${String(group).padStart(8, "0")}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

async function requireSuccess(label, operation) {
  const result = await operation;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function authUsers() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`list auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 100) return users;
  }
}

async function ensureUser(person, role) {
  let user = (await authUsers()).find((candidate) => candidate.email === person.email);
  if (!user) {
    const { data, error } = await client.auth.admin.createUser({
      email: person.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role },
    });
    if (error || !data.user) throw new Error(`create ${person.email}: ${error?.message ?? "no user"}`);
    user = data.user;
  }

  await requireSuccess(`assign ${role} to ${person.email}`, client.rpc("assign_role_atomic", {
    p_user_id: user.id,
    p_role: role,
  }));
  await requireSuccess(`profile ${person.email}`, client.from("profiles").update({
    display_name: person.name,
    active_role: role,
    deleted_at: null,
  }).eq("id", user.id));
  return user.id;
}

const ids = {};
for (const provider of providers) ids[provider.key] = await ensureUser(provider, "service_provider");
for (const peer of peers) ids[peer.key] = await ensureUser(peer, "service_provider");
for (const customer of clients) ids[customer.key] = await ensureUser(customer, "homebuyer");
for (const member of referred) ids[member.key] = await ensureUser(member, "service_provider");

for (const provider of providers) {
  const id = ids[provider.key];
  await requireSuccess(`provider profile ${provider.key}`, client.from("profiles").update({
    provider_verification_status: "verified",
  }).eq("id", id));
  await requireSuccess(`provider details ${provider.key}`, client.from("service_provider_details").upsert({
    user_id: id,
    business_name: provider.name,
    slug: provider.slug,
    services: ["plumber"],
    vouch_gate_grandfathered_at: provider.grandfathered ? NOW : null,
  }, { onConflict: "user_id" }));
  await requireSuccess(`subscription ${provider.key}`, client.from("subscriptions").upsert({
    user_id: id,
    status: "active",
    role: "service_provider",
    plan_name: "professional",
    stripe_customer_id: `cus_vouch_${provider.key}`,
    stripe_subscription_id: `sub_vouch_${provider.key}`,
    billing_interval: "month",
    billing_interval_count: 1,
  }, { onConflict: "user_id" }));
  await requireSuccess(`Stripe Connect ${provider.key}`, client.from("stripe_connect_accounts").upsert({
    provider_id: id,
    stripe_account_id: `acct_vouch_${provider.key}`,
    onboarding_complete: true,
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    kyc_status: "verified",
  }, { onConflict: "provider_id" }));
}

for (const peer of peers) {
  const id = ids[peer.key];
  await requireSuccess(`peer profile ${peer.key}`, client.from("profiles").update({
    provider_verification_status: "verified",
    created_at: "2025-01-01T00:00:00.000Z",
  }).eq("id", id));
  await requireSuccess(`peer provider ${peer.key}`, client.from("service_provider_details").upsert({
    user_id: id,
    business_name: `${peer.name} Trade Services`,
    slug: `vouch-${peer.key.replaceAll("_", "-")}`,
    services: ["electrician"],
    vouch_gate_grandfathered_at: NOW,
  }, { onConflict: "user_id" }));
}

const fixtureProviderIds = providers.map((provider) => ids[provider.key]);
await requireSuccess("clear fixture credits", client.from("referral_credits").delete().in("member_id", fixtureProviderIds));
await requireSuccess("clear fixture referrals", client.from("referrals").delete().in("referrer_id", fixtureProviderIds));
await requireSuccess("clear fixture vouches", client.from("vouches").delete().in("provider_id", fixtureProviderIds));
await requireSuccess("clear fixture requests", client.from("vouch_requests").delete().in("provider_id", fixtureProviderIds));
await requireSuccess("clear fixture badges", client.from("provider_badges").delete().in("provider_id", fixtureProviderIds));

let requestIndex = 100;
let clientIndex = 0;
for (const provider of providers) {
  const providerId = ids[provider.key];
  const accepted = [];
  for (let index = 0; index < provider.peer; index += 1) {
    requestIndex += 1;
    accepted.push({
      id: uuid(21, requestIndex),
      provider_id: providerId,
      voucher_kind: "peer",
      voucher_profile_id: ids[peers[index].key],
      invited_email: peers[index].email,
      invite_token: uuid(22, requestIndex),
      status: "accepted",
      public_attribution_consent: provider.key === "gate_complete",
      requested_at: "2026-06-01T09:00:00.000Z",
      expires_at: FUTURE,
      responded_at: NOW,
      voucher_trade: ["Plumber", "Electrician", "Heating engineer"][index],
    });
  }
  for (let index = 0; index < provider.client; index += 1) {
    const customer = clients[clientIndex];
    clientIndex += 1;
    requestIndex += 1;
    accepted.push({
      id: uuid(21, requestIndex),
      provider_id: providerId,
      voucher_kind: "client",
      voucher_profile_id: ids[customer.key],
      invited_email: customer.email,
      invite_token: uuid(22, requestIndex),
      status: "accepted",
      public_attribution_consent: provider.key === "gate_complete",
      requested_at: "2026-06-01T09:00:00.000Z",
      expires_at: FUTURE,
      responded_at: NOW,
    });
  }
  if (accepted.length > 0) {
    await requireSuccess(`accepted requests ${provider.key}`, client.from("vouch_requests").insert(accepted));
    await requireSuccess(`accepted vouches ${provider.key}`, client.from("vouches").insert(accepted.map((request) => ({
      id: uuid(23, Number(request.id.slice(-12))),
      request_id: request.id,
      provider_id: request.provider_id,
      voucher_kind: request.voucher_kind,
      voucher_profile_id: request.voucher_profile_id,
      accepted_at: request.responded_at,
      public_attribution_consent: request.public_attribution_consent,
      voucher_trade: request.voucher_trade ?? null,
    }))));
  }
}

await requireSuccess("token fixtures", client.from("vouch_requests").insert([
  {
    id: uuid(21, 1), provider_id: ids.gate_empty, voucher_kind: "client",
    invited_email: "signup-lite-client@truedeed.test", invite_token: "10000000-0000-4000-8000-000000000001",
    status: "pending", expires_at: FUTURE,
  },
  {
    id: uuid(21, 2), provider_id: ids.gate_empty, voucher_kind: "peer",
    voucher_profile_id: ids.peer_1, invited_email: peers[0].email,
    invite_token: "10000000-0000-4000-8000-000000000002", status: "pending", expires_at: FUTURE,
  },
  {
    id: uuid(21, 3), provider_id: ids.gate_empty, voucher_kind: "client",
    invited_email: "expired-client@truedeed.test", invite_token: "10000000-0000-4000-8000-000000000003",
    status: "expired", expires_at: PAST, responded_at: PAST,
  },
  {
    id: uuid(21, 4), provider_id: ids.gate_empty, voucher_kind: "client",
    invited_email: "revoked-client@truedeed.test", invite_token: "10000000-0000-4000-8000-000000000004",
    status: "revoked", expires_at: FUTURE, revoked_at: NOW,
  },
]));

const completeId = ids.gate_complete;
await requireSuccess("referral code", client.from("referral_codes_v2").upsert({
  user_id: completeId,
  code: "VOUCHCREW",
}, { onConflict: "user_id" }));

const referrals = [];
const stages = ["invited", "signed_up", "gate_complete", "converted"];
for (let index = 0; index < stages.length; index += 1) {
  const state = stages[index];
  referrals.push({
    id: uuid(31, index + 1),
    referrer_id: completeId,
    referred_id: state === "invited" ? null : ids[`referred_${index + 1}`],
    referral_code: `VOUCHSTAGE${index + 1}`,
    track: "trade_to_trade",
    status: "pending",
    provider_state: state,
    invite_token: uuid(32, index + 1),
    invited_email: referred[index].email,
    signed_up_at: state === "invited" ? null : NOW,
    gate_completed_at: ["gate_complete", "converted"].includes(state) ? NOW : null,
    converted_at: state === "converted" ? NOW : null,
  });
}
for (let index = 0; index < 12; index += 1) {
  referrals.push({
    id: uuid(31, index + 10),
    referrer_id: completeId,
    referred_id: ids[`referred_${index + 4}`],
    referral_code: `VOUCHCREDIT${index + 1}`,
    track: "trade_to_trade",
    status: "rewarded",
    provider_state: "credited",
    invite_token: uuid(32, index + 10),
    invited_email: referred[index + 3].email,
    signed_up_at: NOW,
    gate_completed_at: NOW,
    converted_at: NOW,
    credited_at: NOW,
  });
}
await requireSuccess("referral states", client.from("referrals").insert(referrals));
await requireSuccess("referral cap credits", client.from("referral_credits").insert(
  referrals.filter((referral) => referral.provider_state === "credited").map((referral, index) => ({
    id: uuid(33, index + 1),
    referral_id: referral.id,
    member_id: completeId,
    credit_months: 1,
    status: "applied",
    stripe_balance_transaction_id: `cbtxn_vouch_${index + 1}`,
    idempotency_key: `referral-credit:${referral.id}:${completeId}`,
    attempt_count: 1,
    last_attempted_at: NOW,
    applied_at: NOW,
  })),
));
await requireSuccess("ambassador badge", client.from("provider_badges").insert({
  provider_id: completeId,
  badge_type: "ambassador",
  badge_label: "Ambassador",
  description: "Three or more converted crew referrals",
  is_active: true,
}));

const fixtureManifest = {
  schemaVersion: 1,
  target: supabaseUrl,
  fixtures: Object.fromEntries(providers.map((provider) => [provider.key, {
    profileId: ids[provider.key], slug: provider.slug, peerCount: provider.peer,
    clientCount: provider.client, grandfathered: provider.grandfathered,
  }])),
  tokens: {
    validClient: "10000000-0000-4000-8000-000000000001",
    validPeer: "10000000-0000-4000-8000-000000000002",
    expired: "10000000-0000-4000-8000-000000000003",
    revoked: "10000000-0000-4000-8000-000000000004",
  },
};
mkdirSync("test-results/evidence/vouch-referral", { recursive: true });
writeFileSync(
  "test-results/evidence/vouch-referral/fixture-manifest.json",
  `${JSON.stringify(fixtureManifest, null, 2)}\n`,
);
console.log("Vouch/referral evidence fixtures seeded on local Supabase.");
