import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsArticleList } from "@/components/admin/CmsArticleList";

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cms_articles")
    .select("id, title, status, published_at, created_at")
    .eq("article_type", "blog")
    .order("created_at", { ascending: false });

  const articles = data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Blog Articles"
        description="Create and manage blog posts."
      />
      <CmsArticleList
        articles={articles}
        newHref="/admin/cms/blog/new"
        editHrefPrefix="/admin/cms/blog"
        emptyMessage="No blog articles yet. Click New Article to create one."
      />
    </div>
  );
}
