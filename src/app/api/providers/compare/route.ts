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

  // service_provider_details is keyed by `user_id` (no `id` column). Alias it
  // back to `id` so the response shape stays stable for the client. There is no
  // `city` column on this table, so it is supplied as null in the mapping below.
  const { data, error } = await supabase
    .from("service_provider_details")
    .select(
      "id:user_id, slug, business_name, services, service_postcodes, accreditations, response_time_hours, pricing, profiles(avatar_url, full_name:display_name, provider_verification_status), provider_rating_stats(average_rating, total_reviews)",
    )
    .in("user_id", ids);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch providers." },
      { status: 500 },
    );
  }

  // Supabase returns joined relations as arrays — flatten to single objects
  const providers: CompareProvider[] = (data ?? [])
    .filter((row) => row !== null)
    .map((row) => ({
      ...row,
      // No `city` column on service_provider_details; the compare UI guards on it.
      city: null,
      profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      provider_rating_stats: Array.isArray(row.provider_rating_stats)
        ? row.provider_rating_stats[0] ?? null
        : row.provider_rating_stats,
    })) as CompareProvider[];

  return NextResponse.json({ data: providers });
}
