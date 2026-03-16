import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Step1AddressType } from "@/components/seller/wizard/Step1AddressType";
import { Step2Details } from "@/components/seller/wizard/Step2Details";
import { Step3Photos } from "@/components/seller/wizard/Step3Photos";
import { Step4Description } from "@/components/seller/wizard/Step4Description";
import { Step5Price } from "@/components/seller/wizard/Step5Price";
import { Step6Epc } from "@/components/seller/wizard/Step6Epc";
import { Step7Review } from "@/components/seller/wizard/Step7Review";
import type { ListingStep } from "@/types/seller";

type Props = Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}>;

export default async function EditListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { step: stepStr } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("seller_listings")
    .select("*")
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!listing) redirect("/dashboard/seller/listings");

  const step = Math.min(Math.max(parseInt(stepStr ?? "1", 10), 1), 7) as ListingStep;

  const stepComponents: Record<ListingStep, React.ReactElement> = {
    1: <Step1AddressType listing={listing} />,
    2: <Step2Details listing={listing} listingId={id} />,
    3: <Step3Photos listing={listing} listingId={id} />,
    4: <Step4Description listing={listing} listingId={id} />,
    5: <Step5Price listing={listing} listingId={id} />,
    6: <Step6Epc listing={listing} listingId={id} />,
    7: <Step7Review listing={listing} listingId={id} />,
  };

  return stepComponents[step];
}
