import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CompareProvider } from "@/types/providers";

const querySchema = z.object({
  ids: z
    .string()
    .transform((s) => s.split(","))
    .pipe(z.array(z.string().uuid()).min(1).max(5)),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = { ids: searchParams.get("ids") ?? "" };

  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ids parameter. Provide 1–5 comma-separated UUIDs." },
      { status: 400 },
    );
  }

  const { ids } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      "id, slug, business_name, services, city, service_postcodes, accreditations, response_time_hours, pricing, profiles(avatar_url, full_name, provider_verification_status), provider_rating_stats(average_rating, total_reviews)",
    )
    .in("id", ids);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch providers." },
      { status: 500 },
    );
  }

  // Filter out stale/missing IDs — only return providers that were found
  const providers: CompareProvider[] = (data ?? []).filter(
    (row): row is CompareProvider => row !== null,
  );

  return NextResponse.json({ data: providers });
}
