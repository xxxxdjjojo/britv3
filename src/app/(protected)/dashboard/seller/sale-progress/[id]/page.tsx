import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { SaleProgressionStepper } from "@/components/seller/sale-progress/SaleProgressionStepper";
import { SaleDocumentsList } from "@/components/seller/sale-progress/SaleDocumentsList";
import { SaleContactsSidebar } from "@/components/seller/sale-progress/SaleContactsSidebar";
import { getSaleProgressionById } from "@/services/seller/sale-progression-service";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

type ListingShape = {
  address_line_1: string | null;
  city: string | null;
} | null;

export default async function SaleProgressionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progression = await getSaleProgressionById(supabase, id);
  if (!progression) redirect("/dashboard/seller/offers");

  const { data: offer } = await supabase
    .from("seller_offers")
    .select(`
      id, buyer_name, amount,
      listing:listing_id ( address_line_1, city, postcode )
    `)
    .eq("id", progression.offer_id)
    .maybeSingle();

  const listing = (offer?.listing as unknown as ListingShape) ?? null;
  const address = offer
    ? [listing?.address_line_1, listing?.city].filter(Boolean).join(", ")
    : "Property";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/seller/offers"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={16} />
            Offers
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mt-2">
            Sale Progression
          </h1>
          <p className="text-slate-500 mt-1">
            {address}
            {offer && ` · Buyer: ${offer.buyer_name}`}
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Share2 size={16} />
          Share Progress
        </button>
      </div>

      <SaleProgressionStepper progression={progression} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SaleDocumentsList progression={progression} />
        </div>
        <div>
          <SaleContactsSidebar progression={progression} />
        </div>
      </div>
    </div>
  );
}
