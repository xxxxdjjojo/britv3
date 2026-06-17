import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsEditor } from "@/components/admin/CmsEditor";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditorPage({ params }: Props) {
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
        eyebrow="Content"
        title={isNew ? "New Blog Article" : "Edit Blog Article"}
        description="Write and publish blog content."
      />
      <CmsEditor
        article={article}
        articleType="blog"
        backHref="/admin/cms/blog"
      />
    </div>
  );
}
