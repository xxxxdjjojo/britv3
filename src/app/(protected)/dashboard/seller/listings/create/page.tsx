import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Step1AddressType } from "@/components/seller/wizard/Step1AddressType";
import { Step2Details } from "@/components/seller/wizard/Step2Details";
import { Step3Photos } from "@/components/seller/wizard/Step3Photos";
import { Step4Description } from "@/components/seller/wizard/Step4Description";
import { Step5Price } from "@/components/seller/wizard/Step5Price";
import { Step6Epc } from "@/components/seller/wizard/Step6Epc";
import { Step7Review } from "@/components/seller/wizard/Step7Review";
import type { ListingStep, SellerListing } from "@/types/seller";

type Props = Readonly<{
  searchParams: Promise<{ step?: string; id?: string }>;
}>;

export default async function CreateListingPage({ searchParams }: Props) {
  const { step: stepStr, id: listingId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const step = Math.min(Math.max(parseInt(stepStr ?? "1", 10), 1), 7) as ListingStep;

  // If we have a listing ID, load existing draft
  let listing: Partial<SellerListing> | null = null;
  if (listingId) {
    const { data } = await supabase
      .from("seller_listings")
      .select("*")
      .eq("id", listingId)
      .eq("seller_id", user.id)
      .maybeSingle();
    listing = data;
  }

  // Validate prior steps are complete before allowing access to later steps
  if (listing && step > 1) {
    const stepChecks: Record<number, (l: Partial<SellerListing>) => boolean> = {
      2: (l) => !!(l.address_line_1 && l.property_type && l.tenure),
      3: (l) => !!(l.bedrooms !== undefined && l.bedrooms !== null),
      4: (l) => !!((l.photos?.length ?? 0) >= 1),
      5: (l) => !!((l.description?.length ?? 0) >= 10),
      6: (l) => !!(l.asking_price && l.asking_price > 0),
      7: (l) => true,
    };
    let maxValid = 1;
    for (let s = 2; s <= step; s++) {
      if (!stepChecks[s]?.(listing)) break;
      maxValid = s;
    }
    if (maxValid < step) {
      redirect(`/dashboard/seller/listings/create?step=${maxValid}&id=${listingId}`);
    }
  }

  // Redirect to step 1 if no listing id and step > 1
  if (!listingId && step > 1) redirect("/dashboard/seller/listings/create?step=1");
  if (step > 1 && !listingId) redirect("/dashboard/seller/listings/create?step=1");

  const stepComponents: Record<ListingStep, React.ReactElement> = {
    1: <Step1AddressType listing={listing} />,
    2: <Step2Details listing={listing} listingId={listingId} />,
    3: <Step3Photos listing={listing} listingId={listingId!} />,
    4: <Step4Description listing={listing} listingId={listingId!} />,
    5: <Step5Price listing={listing} listingId={listingId!} />,
    6: <Step6Epc listing={listing} listingId={listingId!} />,
    7: <Step7Review listing={listing} listingId={listingId!} />,
  };

  return stepComponents[step];
}
