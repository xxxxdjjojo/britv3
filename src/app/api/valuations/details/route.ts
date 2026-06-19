import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionByToken, saveDetails } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

const detailsSchema = z.object({
  subtype: z.enum(["detached", "semi_detached", "terraced", "end_terrace", "bungalow", "flat", "other"]),
  bedrooms: z.number().int().min(0).max(20).nullable(),
  bathrooms: z.number().int().min(0).max(20).nullable(),
  floorAreaSqm: z.number().min(5).max(2000).nullable(),
  tenure: z.enum(["freehold", "leasehold", "share_of_freehold", "unknown"]),
  newBuild: z.boolean(),
  condition: z
    .enum(["needs_major_work", "below_average", "average", "good", "recently_renovated"])
    .nullable(),
  hasExtensionOrLoft: z.boolean(),
  parking: z.boolean(),
  garden: z.boolean(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  if (!token || !(await getSessionByToken(token))) {
    return NextResponse.json({ error: "No active valuation session" }, { status: 400 });
  }
  const parsed = detailsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the required details" }, { status: 400 });
  }
  await saveDetails(token, parsed.data);
  return NextResponse.json({ ok: true });
}
