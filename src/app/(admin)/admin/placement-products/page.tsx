import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPlacementProductsClient } from "@/components/admin/AdminPlacementProductsClient";
import { listAllProducts } from "@/services/placements/placement-admin-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placement Pricing — Admin" };

export default async function AdminPlacementProductsPage() {
  const supabase = await createClient();

  let products: Awaited<ReturnType<typeof listAllProducts>> = [];
  try {
    products = await listAllProducts(supabase);
  } catch {
    products = [];
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Growth"
        title="Placement Pricing"
        description="Configure boost products by category, region, placement type, slot limit and monthly price. Nothing is hardcoded."
      />
      <AdminPlacementProductsClient initialProducts={products} />
    </div>
  );
}
