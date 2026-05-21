/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Find an Architect Near You | Britestate",
  description:
    "Compare RIBA-accredited architects for home extensions, new builds and planning applications across the UK.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

export default async function ArchitectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const postcode = params.postcode;
  const q = params.q;

  const supabase = await createClient();

  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: "architect" as ServiceCategory,
      postcode,
      radius: 25,
      search_query: q,
    });
    initialProviders =
      (result.data as unknown as ServiceProviderPublicProfile[]) ?? [];
    initialCount = result.count ?? 0;
  } catch (err) {
    console.error("Architect search error:", err);
  }

  return (
    <ProviderSearchPage
      pageTitle="Find an Architect"
      pageSubtitle="Compare RIBA-accredited architects for residential extensions, new builds, planning applications and design projects."
      defaultCategory={"architect" as ServiceCategory}
      specialistBadge={null}
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
