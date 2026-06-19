/**
 * Provider slug generation. Kept dependency-light (Supabase types only) so it
 * is safe to import from Client Components — unlike `provider-service.ts`, which
 * pulls in `sharp` via the file validator and must stay server-only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a unique provider slug from a business name, appending an
 * incrementing suffix until no existing `service_provider_details` row collides.
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  businessName: string,
): Promise<string> {
  const base = slugify(businessName);

  const { data: existing } = await supabase
    .from("service_provider_details")
    .select("slug")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;

  while (true) {
    const { data: check } = await supabase
      .from("service_provider_details")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!check) {
      return candidate;
    }

    suffix++;
    candidate = `${base}-${suffix}`;
  }
}
