import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSessionByToken, saveAddress } from "@/services/valuation/session-repo";
import { fetchAddressCandidates } from "@/services/valuation/comparables-repo";
import { normalisePostcode, outwardCode } from "@/lib/valuation/postcode";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

/** GET ?postcode=SW18%204QN — candidate addresses for a postcode. */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const normalised = normalisePostcode(searchParams.get("postcode"));
  if (!normalised) {
    return NextResponse.json({ error: "Enter a valid UK postcode" }, { status: 400 });
  }
  const candidates = await fetchAddressCandidates(normalised);
  return NextResponse.json({ postcode: normalised, outwardCode: outwardCode(normalised), candidates });
}

const addressSchema = z.object({
  postcode: z.string(),
  paon: z.string().nullable().optional(),
  saon: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  label: z.string().min(1),
});

/** POST — persist the chosen address on the session. */
export async function POST(request: Request): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  if (!token || !(await getSessionByToken(token))) {
    return NextResponse.json({ error: "No active valuation session" }, { status: 400 });
  }
  const parsed = addressSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const normalised = normalisePostcode(parsed.data.postcode);
  const outward = outwardCode(parsed.data.postcode);
  if (!normalised || !outward) {
    return NextResponse.json({ error: "Invalid postcode" }, { status: 400 });
  }
  await saveAddress(token, {
    postcode: normalised,
    outwardCode: outward,
    paon: parsed.data.paon ?? null,
    saon: parsed.data.saon ?? null,
    street: parsed.data.street ?? null,
    label: parsed.data.label,
  });
  return NextResponse.json({ ok: true });
}
