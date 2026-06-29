// Public reads for the New Homes section. Published developments/units/media
// are publicly readable (RLS), so the anon server client is sufficient.

import { createClient } from "@/lib/supabase/server";
import type { DevelopmentCard, DevelopmentDetail } from "@/lib/new-homes/types";
import { filterDevelopments, type NewHomesFilters } from "@/lib/new-homes/filters";
import {
  mapDevelopmentCard,
  mapDevelopmentDetail,
} from "./mappers";

const DEVELOPER_FIELDS =
  "id, slug, name, logo_url, brand_colour, tagline, about, website_url, contact_email, contact_phone, year_established, homes_built, regions";

type Row = Record<string, unknown>;

/** Fetch all published developments (joined with developer) as cards. */
export async function listDevelopments(
  filters: NewHomesFilters = {},
): Promise<DevelopmentCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developments")
    .select(`*, developer:developers!inner(${DEVELOPER_FIELDS})`)
    .eq("is_published", true)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const cards = (data as Row[])
    .filter((row) => row.developer)
    .map((row) => mapDevelopmentCard(row, row.developer as Row));

  return filterDevelopments(cards, filters);
}

/** Fetch a single development with developer, units and media. */
export async function getDevelopmentBySlug(
  slug: string,
): Promise<DevelopmentDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developments")
    .select(`*, developer:developers!inner(${DEVELOPER_FIELDS})`)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as Row;
  if (!row.developer) return null;

  const [unitsRes, mediaRes] = await Promise.all([
    supabase
      .from("development_units")
      .select("*")
      .eq("development_id", row.id)
      .order("plot_number", { ascending: true }),
    supabase
      .from("development_media")
      .select("*")
      .eq("development_id", row.id)
      .order("sort_order", { ascending: true }),
  ]);

  return mapDevelopmentDetail(
    row,
    row.developer as Row,
    (unitsRes.data as Row[]) ?? [],
    (mediaRes.data as Row[]) ?? [],
  );
}

/** Up to `limit` published developments in the same city, excluding `excludeId`. */
export async function getSimilarDevelopments(
  city: string,
  excludeId: string,
  limit = 3,
): Promise<DevelopmentCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developments")
    .select(`*, developer:developers!inner(${DEVELOPER_FIELDS})`)
    .eq("is_published", true)
    .neq("id", excludeId)
    .limit(limit + 4);

  if (error || !data) return [];
  const rows = data as Row[];
  const sameCity = rows.filter((r) => r.city === city);
  const chosen = (sameCity.length >= limit ? sameCity : rows).slice(0, limit);
  return chosen
    .filter((row) => row.developer)
    .map((row) => mapDevelopmentCard(row, row.developer as Row));
}

/** All published development slugs — for sitemap + static metadata. */
export async function getAllDevelopmentSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("developments")
    .select("slug")
    .eq("is_published", true);
  if (error || !data) return [];
  return (data as Row[]).map((r) => String(r.slug));
}
