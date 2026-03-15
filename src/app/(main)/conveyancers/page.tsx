import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Find a Conveyancer Near You | Britestate",
  description:
    "Compare SRA-regulated solicitors and licensed conveyancers. Fixed fees, no sale no fee options, and fast turnarounds.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

export default async function ConveyancersPage({ searchParams }: Props) {
  const params = await searchParams;
  const postcode = params.postcode;
  const q = params.q;

  const supabase = await createClient();

  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: "conveyancing" as ServiceCategory,
      postcode,
      radius: 25,
      search_query: q,
    });
    initialProviders =
      (result.data as unknown as ServiceProviderPublicProfile[]) ?? [];
    initialCount = result.count ?? 0;
  } catch (err) {
    console.error("Conveyancer search error:", err);
  }

  return (
    <ProviderSearchPage
      pageTitle="Find a Conveyancer"
      pageSubtitle="Compare SRA-regulated solicitors and licensed conveyancers for your property purchase, sale or remortgage."
      defaultCategory={"conveyancing" as ServiceCategory}
      specialistBadge="SRA"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
