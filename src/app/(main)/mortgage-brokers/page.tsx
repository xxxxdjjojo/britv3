import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Find a Mortgage Broker Near You",
  description:
    "Compare FCA-authorised mortgage brokers across the UK. Whole-of-market advisers, fee-free options and specialist buy-to-let brokers.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

export default async function MortgageBrokersPage({ searchParams }: Props) {
  const params = await searchParams;
  const postcode = params.postcode;
  const q = params.q;

  const supabase = await createClient();

  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: "mortgage_broker" as ServiceCategory,
      postcode,
      radius: 25,
      search_query: q,
    });
    initialProviders =
      (result.data as unknown as ServiceProviderPublicProfile[]) ?? [];
    initialCount = result.count ?? 0;
  } catch (err) {
    console.error("Mortgage broker search error:", err);
  }

  return (
    <ProviderSearchPage
      pageTitle="Find a Mortgage Broker"
      pageSubtitle="Connect with FCA-authorised mortgage brokers — whole-of-market advisers, first-time buyer specialists, and buy-to-let experts."
      defaultCategory={"mortgage_broker" as ServiceCategory}
      specialistBadge="FCA"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
