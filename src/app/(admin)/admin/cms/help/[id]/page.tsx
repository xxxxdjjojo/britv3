import { Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const CmsEditor = dynamic(
  () => import("@/components/admin/CmsEditor").then((mod) => mod.CmsEditor),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);

type Props = {
  params: Promise<{ id: string }>;
};


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";

  let article = undefined;

  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cms_articles")
      .select(
        "id, title, slug, excerpt, content, seo_title, seo_description, og_image_url, status, article_type",
      )
      .eq("id", id)
      .single();

    if (!data) return notFound();
    article = data as {
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      seo_title: string;
      seo_description: string;
      og_image_url: string;
      status: "draft" | "published";
      article_type: "blog" | "help" | "landing";
    };
  }

  return (
    <div>
      <AdminPageHeader
        title={isNew ? "New Help Article" : "Edit Help Article"}
        description="Write and publish help centre content."
      />
      <CmsEditor
        article={article}
        articleType="help"
        backHref="/admin/cms/help"
      />
    </div>
  );
}

export default function AdminHelpEditorPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
