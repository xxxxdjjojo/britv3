import { auditedAdminAction } from "@/lib/audited-admin-action";

type PromoCodePayload = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  applies_to?: string | null;
};

export async function POST(req: Request) {
  let body: PromoCodePayload;
  try {
    body = (await req.json()) as PromoCodePayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  return auditedAdminAction(
    req,
    "promo_code.create",
    "promo_code",
    "new",
    async ({ supabase }) => {

      if (!body.code?.trim()) throw new Error("Code is required");
      if (!body.discount_value || body.discount_value <= 0) {
        throw new Error("Discount value must be greater than 0");
      }

      const { data, error } = await supabase
        .from("promo_codes")
        .insert({
          code: body.code.trim().toUpperCase(),
          discount_type: body.discount_type,
          discount_value: body.discount_value,
          max_uses: body.max_uses ?? null,
          valid_from: body.valid_from ?? null,
          valid_until: body.valid_until ?? null,
          applies_to: body.applies_to ?? null,
          uses_count: 0,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return { id: data.id };
    },
  );
}
