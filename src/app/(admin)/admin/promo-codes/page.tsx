import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PromoCodesClient } from "@/components/admin/PromoCodesClient";

export default async function AdminPromoCodesPage() {
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
        eyebrow="Growth"
        title="Promo Codes"
        description="Create and manage discount codes for your users."
      />
      <PromoCodesClient promoCodes={promoCodes} />
    </div>
  );
}
