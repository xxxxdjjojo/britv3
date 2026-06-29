// Developer dashboard reads. Every query runs through the authenticated server
// client, so RLS scopes results to the developer org(s) the user belongs to —
// a developer can never see another developer's developments or leads. We also
// filter by developerId explicitly as defence-in-depth.

import { createClient } from "@/lib/supabase/server";
import {
  computeConversionMetrics,
  rankDevelopmentPerformance,
  type ConversionMetrics,
  type DevelopmentPerformance,
} from "@/lib/new-homes/metrics";
import type {
  DevelopmentCard,
  DevelopmentLead,
  DevelopmentViewing,
} from "@/lib/new-homes/types";
import { mapLead, mapViewing } from "./mappers";

type Row = Record<string, unknown>;

export interface DeveloperContext {
  developerId: string;
  developerName: string;
}

/** Resolve the developer org the current user manages, or null if none. */
export async function resolveDeveloperForUser(
  userId: string,
): Promise<DeveloperContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developer_members")
    .select("developer_id, developers!inner(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as Row;
  const developer = row.developers as Row | undefined;
  if (!developer) return null;
  return {
    developerId: String(row.developer_id),
    developerName: String(developer.name),
  };
}

export interface DashboardDevelopment {
  id: string;
  name: string;
  slug: string;
  status: string;
  totalUnits: number | null;
  availableUnits: number | null;
}

export interface DeveloperDashboardData {
  developments: DashboardDevelopment[];
  leads: DevelopmentLead[];
  viewings: DevelopmentViewing[];
  metrics: ConversionMetrics;
  topDevelopments: DevelopmentPerformance[];
}

export async function getDeveloperDashboardData(
  developerId: string,
): Promise<DeveloperDashboardData> {
  const supabase = await createClient();

  const { data: devRows } = await supabase
    .from("developments")
    .select("id, name, slug, status, total_units, available_units")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  const developments: DashboardDevelopment[] = ((devRows as Row[]) ?? []).map(
    (r) => ({
      id: String(r.id),
      name: String(r.name),
      slug: String(r.slug),
      status: String(r.status),
      totalUnits: r.total_units == null ? null : Number(r.total_units),
      availableUnits: r.available_units == null ? null : Number(r.available_units),
    }),
  );

  const developmentIds = developments.map((d) => d.id);

  if (developmentIds.length === 0) {
    return {
      developments,
      leads: [],
      viewings: [],
      metrics: computeConversionMetrics([], []),
      topDevelopments: [],
    };
  }

  const devNameById = new Map(developments.map((d) => [d.id, d.name]));

  const [leadsRes, viewingsRes] = await Promise.all([
    supabase
      .from("development_leads")
      .select("*")
      .in("development_id", developmentIds)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("development_viewings")
      .select("*")
      .in("development_id", developmentIds)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const leads: DevelopmentLead[] = ((leadsRes.data as Row[]) ?? []).map((r) => {
    const lead = mapLead(r);
    lead.developmentName = devNameById.get(lead.developmentId);
    return lead;
  });
  const viewings: DevelopmentViewing[] = ((viewingsRes.data as Row[]) ?? []).map(
    mapViewing,
  );

  return {
    developments,
    leads,
    viewings,
    metrics: computeConversionMetrics(leads, viewings),
    topDevelopments: rankDevelopmentPerformance(developments, leads),
  };
}

/** Lightweight cards for the developer's own developments (dashboard list). */
export async function getDeveloperDevelopmentCards(
  developerId: string,
): Promise<Pick<DevelopmentCard, "id" | "name" | "slug" | "status">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("developments")
    .select("id, name, slug, status")
    .eq("developer_id", developerId);
  return ((data as Row[]) ?? []).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    status: String(r.status) as DevelopmentCard["status"],
  }));
}
