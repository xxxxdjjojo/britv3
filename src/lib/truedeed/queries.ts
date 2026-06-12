/**
 * Truedeed server-side read queries — shared by the agent introductions page,
 * GET /api/truedeed/introductions, the admin rebuttals page, and
 * GET /api/admin/truedeed/rebuttals.
 *
 * Runs with the service-role client: the truedeed tables are locked down by
 * RLS and read access is mediated here (callers must have already verified
 * the requesting user).
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AgentIntroduction,
  IntroductionContactType,
  IntroductionStatus,
  PendingRebuttal,
} from "@/types/truedeed";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export type AgentIntroductionRow = AgentIntroduction & {
  /** True while a submitted rebuttal awaits an admin decision. */
  underReview: boolean;
};

type PropertyAddress = {
  address_line1: string | null;
  city: string | null;
  postcode: string | null;
} | null;

type IntroductionQueryRow = {
  id: string;
  applicant_name: string;
  first_contact_type: string;
  occurred_at: string;
  rebuttal_deadline: string | null;
  listings: { id: string; properties: PropertyAddress } | null;
  introduction_status_history: Array<{ status: string; created_at: string }> | null;
};

function formatAddress(property: PropertyAddress): string {
  if (!property) return "Unknown address";
  const parts = [property.address_line1, property.city, property.postcode]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown address";
}

function latestStatus(
  history: Array<{ status: string; created_at: string }> | null,
): IntroductionStatus {
  if (!history || history.length === 0) return "active";
  const sorted = [...history].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  return sorted[0].status as IntroductionStatus;
}

/**
 * All introductions visible to an agent user: their own (agent_id) plus any
 * belonging to branches where they are a team member.
 */
export async function getAgentIntroductions(
  userId: string,
): Promise<AgentIntroductionRow[]> {
  const supabase = createAdminClient();

  const { data: memberships } = await supabase
    .from("agent_team_members")
    .select("branch_id")
    .eq("user_id", userId);
  const branchIds = (memberships ?? [])
    .map((row) => row.branch_id as string | null)
    .filter((id): id is string => Boolean(id));

  let query = supabase
    .from("introductions")
    .select(
      `id, applicant_name, first_contact_type, occurred_at, rebuttal_deadline,
       listings ( id, properties ( address_line1, city, postcode ) ),
       introduction_status_history ( status, created_at )`,
    )
    .order("occurred_at", { ascending: false });

  query =
    branchIds.length > 0
      ? query.or(`agent_id.eq.${userId},branch_id.in.(${branchIds.join(",")})`)
      : query.eq("agent_id", userId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load introductions: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as IntroductionQueryRow[];

  let pendingIds = new Set<string>();
  if (rows.length > 0) {
    const { data: pending } = await supabase
      .from("rebuttals")
      .select("introduction_id")
      .is("decision", null)
      .in(
        "introduction_id",
        rows.map((row) => row.id),
      );
    pendingIds = new Set(
      (pending ?? []).map((row) => row.introduction_id as string),
    );
  }

  const now = Date.now();
  return rows.map((row) => {
    const status = latestStatus(row.introduction_status_history);
    const underReview = pendingIds.has(row.id);
    const rebuttalOpen =
      row.rebuttal_deadline !== null &&
      now <= new Date(row.rebuttal_deadline).getTime() &&
      status === "active" &&
      !underReview;

    return {
      id: row.id,
      applicantName: row.applicant_name,
      listingAddress: formatAddress(row.listings?.properties ?? null),
      contactType: row.first_contact_type as IntroductionContactType,
      occurredAt: row.occurred_at,
      status,
      rebuttalDeadline: row.rebuttal_deadline,
      rebuttalOpen,
      underReview,
    };
  });
}

type PendingRebuttalQueryRow = {
  id: string;
  evidence_dated_at: string;
  evidence_storage_paths: string[];
  submitted_at: string;
  introductions: {
    applicant_name: string;
    occurred_at: string;
    listings: { id: string; properties: PropertyAddress } | null;
    agent_branches: { name: string | null } | null;
  } | null;
};

/** Pending (undecided) rebuttals with 1-hour signed evidence URLs. */
export async function getPendingRebuttals(): Promise<PendingRebuttal[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rebuttals")
    .select(
      `id, evidence_dated_at, evidence_storage_paths, submitted_at,
       introductions (
         applicant_name, occurred_at,
         listings ( id, properties ( address_line1, city, postcode ) ),
         agent_branches ( name )
       )`,
    )
    .is("decision", null)
    .order("submitted_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load pending rebuttals: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as PendingRebuttalQueryRow[];

  return Promise.all(
    rows.map(async (row) => {
      const signed = await Promise.all(
        (row.evidence_storage_paths ?? []).map(async (path) => {
          const { data: url } = await supabase.storage
            .from("rebuttal-evidence")
            .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
          return url?.signedUrl ?? null;
        }),
      );

      return {
        rebuttalId: row.id,
        introduction: {
          applicantName: row.introductions?.applicant_name ?? "Unknown applicant",
          listingAddress: formatAddress(
            row.introductions?.listings?.properties ?? null,
          ),
          occurredAt: row.introductions?.occurred_at ?? row.submitted_at,
        },
        evidenceDatedAt: row.evidence_dated_at,
        evidenceUrls: signed.filter((url): url is string => Boolean(url)),
        submittedAt: row.submitted_at,
        branchName: row.introductions?.agent_branches?.name ?? "Unknown branch",
      };
    }),
  );
}
