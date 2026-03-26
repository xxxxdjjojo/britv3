import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromoCodesClient } from "@/components/admin/PromoCodesClient";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("promo_codes")
    .select(
      "id, code, discount_type, discount_value, uses_count, max_uses, valid_until, applies_to",
    )
    .order("created_at", { ascending: false });

  const promoCodes = data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Promo Codes"
        description="Create and manage discount codes for your users."
      />
      <PromoCodesClient promoCodes={promoCodes} />
    </div>
  );
}

export default function AdminPromoCodesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
