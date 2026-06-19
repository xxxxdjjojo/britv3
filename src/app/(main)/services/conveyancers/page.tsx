import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const metadata: Metadata = {
  title: "Find a Conveyancer Near You | TrueDeed",
  description:
    "Compare SRA-regulated conveyancers. Fixed-fee quotes, no hidden costs — find a conveyancer near you.",
};

type PageProps = Readonly<{
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}>;

export default async function ConveyancersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const postcode = sp.postcode ?? undefined;
  const searchQuery = sp.q ?? undefined;
  const defaultCat: ServiceCategory = "conveyancing";

  const supabase = await createClient();
  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: defaultCat,
      postcode,
      radius: 25,
      search_query: searchQuery,
    });
    initialProviders = result.data as unknown as ServiceProviderPublicProfile[];
    initialCount = result.count;
  } catch {
    initialProviders = [];
    initialCount = 0;
  }

  return (
    <ProviderSearchPage
      pageTitle="Find a Conveyancer"
      pageSubtitle="Compare SRA-regulated conveyancers — fixed-fee quotes, no hidden costs."
      defaultCategory={defaultCat}
      specialistBadge="SRA"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
