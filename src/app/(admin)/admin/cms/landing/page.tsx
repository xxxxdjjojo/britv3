import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsArticleList } from "@/components/admin/CmsArticleList";

export default async function AdminLandingPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cms_articles")
    .select("id, title, status, published_at, created_at")
    .eq("article_type", "landing")
    .order("created_at", { ascending: false });

  const articles = data ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Landing Pages"
        description="Create and manage marketing landing pages."
      />
      <CmsArticleList
        articles={articles}
        newHref="/admin/cms/landing/new"
        editHrefPrefix="/admin/cms/landing"
        emptyMessage="No landing pages yet. Click New Article to create one."
      />
    </div>
  );
}
