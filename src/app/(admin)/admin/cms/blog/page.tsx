import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsArticleList } from "@/components/admin/CmsArticleList";
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

export default function AdminBlogPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
