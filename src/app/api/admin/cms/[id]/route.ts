import { auditedAdminActionWithPermission } from "@/lib/audited-admin-action";
import { sanitizeCmsHtml } from "@/lib/validation/sanitize-cms";
import { sanitizeText } from "@/lib/validation/sanitize-text";

type CmsPayload = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  status?: "draft" | "published";
  article_type?: "blog" | "help" | "landing";
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: CmsPayload;
  try {
    body = (await req.json()) as CmsPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminActionWithPermission(
    req,
    "cms.upsert",
    "cms_article",
    id,
    "manage_cms",
    async ({ supabase }) => {

      const isNew = id === "new";

      const payload: Record<string, unknown> = {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt ? sanitizeText(body.excerpt) : null,
        content: sanitizeCmsHtml(body.content ?? ""),
        seo_title: body.seo_title ? sanitizeText(body.seo_title) : null,
        seo_description: body.seo_description ? sanitizeText(body.seo_description) : null,
        og_image_url: body.og_image_url ?? null,
        status: body.status ?? "draft",
        article_type: body.article_type,
        updated_at: new Date().toISOString(),
      };

      if (body.status === "published") {
        payload.published_at = new Date().toISOString();
      }

      if (isNew) {
        const { data, error } = await supabase
          .from("cms_articles")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        return { id: data.id };
      } else {
        const { error } = await supabase
          .from("cms_articles")
          .update(payload)
          .eq("id", id);

        if (error) throw new Error(error.message);
        return { id };
      }
    },
  );
}
