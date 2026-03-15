import { auditedAdminAction } from "@/lib/audited-admin-action";

type SeoPayload = {
  seo_title?: string;
  seo_description?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: SeoPayload;
  try {
    body = (await req.json()) as SeoPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminAction(
    req,
    "cms.seo_update",
    "cms_article",
    id,
    async ({ supabase }) => {

      const { error } = await supabase
        .from("cms_articles")
        .update({
          seo_title: body.seo_title ?? null,
          seo_description: body.seo_description ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);
      return { id };
    },
  );
}
