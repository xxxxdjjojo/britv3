import { auditedAdminAction } from "@/lib/audited-admin-action";

type CampaignPayload = {
  name: string;
  subject: string;
  content?: string;
  target_roles?: string[];
  scheduled_at?: string | null;
};

export async function POST(req: Request) {
  let body: CampaignPayload;
  try {
    body = (await req.json()) as CampaignPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminAction(
    req,
    "campaign.create",
    "email_campaign",
    "new",
    async ({ supabase }) => {

      if (!body.name?.trim()) throw new Error("Campaign name is required");
      if (!body.subject?.trim()) throw new Error("Subject is required");

      const { data, error } = await supabase
        .from("email_campaigns")
        .insert({
          name: body.name.trim(),
          subject: body.subject.trim(),
          content: body.content ?? "",
          target_roles: body.target_roles ?? [],
          scheduled_at: body.scheduled_at ?? null,
          status: "draft",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return { id: data.id };
    },
  );
}
