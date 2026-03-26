import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SeoManagementClient } from "@/components/admin/SeoManagementClient";
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
    .from("cms_articles")
    .select("id, title, article_type, status, seo_title, seo_description")
    .eq("status", "published")
    .order("article_type", { ascending: true });

  const articles = data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="SEO Management"
        description="Edit SEO titles and descriptions for all published articles."
      />
      <SeoManagementClient articles={articles} />
    </div>
  );
}

export default function AdminSeoPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
