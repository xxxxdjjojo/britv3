import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortfolioGrid } from "@/components/dashboard/provider/PortfolioGrid";
import { getPortfolioItems } from "@/services/provider/provider-portfolio-service";
import type { ProviderPortfolioItem } from "@/types/provider-dashboard";

export const metadata = {
  title: "Portfolio | Provider Dashboard",
};

export default async function ProviderPortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  let items: ProviderPortfolioItem[] = [];
  try {
    items = await getPortfolioItems(supabase, providerId);
  } catch {
    items = [];
  }

  const totalPhotos = items.reduce((acc, item) => {
    let count = 0;
    if (item.before_image_path) count++;
    if (item.after_image_path) count++;
    return acc + count;
  }, 0);

  const featuredCount = items.filter((i) => i.is_featured).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Page header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <span className="text-[0.6875rem] font-bold tracking-[0.05em] text-on-surface-variant uppercase">
            Provider Portfolio
          </span>
          <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight mt-2">
            Manage Projects
          </h1>
        </div>
      </header>

      {/* Stats bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
          <span className="text-on-surface-variant text-[0.6875rem] font-bold tracking-widest uppercase mb-2">
            Total Projects
          </span>
          <span className="text-4xl font-extrabold font-headline text-primary">
            {items.length}
          </span>
          <div className="mt-4 w-12 h-1 bg-secondary-fixed rounded-full" />
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
          <span className="text-on-surface-variant text-[0.6875rem] font-bold tracking-widest uppercase mb-2">
            Total Photos
          </span>
          <span className="text-4xl font-extrabold font-headline text-primary">
            {totalPhotos}
          </span>
          <div className="mt-4 w-12 h-1 bg-primary-fixed-dim rounded-full" />
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
          <span className="text-on-surface-variant text-[0.6875rem] font-bold tracking-widest uppercase mb-2">
            Featured
          </span>
          <span className="text-4xl font-extrabold font-headline text-primary">
            {featuredCount}
          </span>
          <div className="mt-4 w-12 h-1 bg-secondary-container rounded-full" />
        </div>
      </section>

      {/* Grid */}
      <PortfolioGrid initialItems={items} providerId={providerId} />
    </div>
  );
}
