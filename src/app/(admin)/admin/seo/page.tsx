import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SeoManagementClient } from "@/components/admin/SeoManagementClient";

export default async function AdminSeoPage() {
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
