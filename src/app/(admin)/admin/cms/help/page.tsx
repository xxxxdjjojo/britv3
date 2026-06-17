import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsArticleList } from "@/components/admin/CmsArticleList";

export default async function AdminHelpPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cms_articles")
    .select("id, title, status, published_at, created_at")
    .eq("article_type", "help")
    .order("created_at", { ascending: false });

  const articles = data ?? [];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Help Articles"
        description="Create and manage help centre content."
      />
      <CmsArticleList
        articles={articles}
        newHref="/admin/cms/help/new"
        editHrefPrefix="/admin/cms/help"
        emptyMessage="No help articles yet. Click New Article to create one."
      />
    </div>
  );
}
