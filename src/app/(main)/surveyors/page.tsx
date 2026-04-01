import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchPage } from "@/components/providers/ProviderSearchPage";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Find a Surveyor Near You | Britestate",
  description:
    "Compare RICS-accredited surveyors for HomeBuyer Reports, Building Surveys and Valuations across the UK.",
};

type Props = {
  searchParams: Promise<Record<string, string>>;
};

export default async function SurveyorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const postcode = params.postcode;
  const q = params.q;

  const supabase = await createClient();

  let initialProviders: ServiceProviderPublicProfile[] = [];
  let initialCount = 0;

  try {
    const result = await searchProviders(supabase, {
      service_category: "surveying" as ServiceCategory,
      postcode,
      radius: 25,
      search_query: q,
    });
    initialProviders =
      (result.data as unknown as ServiceProviderPublicProfile[]) ?? [];
    initialCount = result.count ?? 0;
  } catch (err) {
    console.error("Surveyor search error:", err);
  }

  return (
    <ProviderSearchPage
      pageTitle="Chartered Surveyors"
      pageSubtitle="Compare RICS-accredited surveyors for HomeBuyer Reports, Building Surveys and Valuations."
      defaultCategory={"surveying" as ServiceCategory}
      specialistBadge="RICS"
      initialProviders={initialProviders}
      initialCount={initialCount}
    />
  );
}
