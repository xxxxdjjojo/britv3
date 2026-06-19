import { createClient } from "@/lib/supabase/server";
import { getPropertyDetail } from "@/services/landlord/portfolio-service";
import PropertyOverview from "@/components/landlord/PropertyOverview";

export const metadata = {
  title: "Property Overview | TrueDeed",
};

export default async function PropertyOverviewPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const property = await getPropertyDetail(supabase, id);

  return <PropertyOverview property={property} />;
}
