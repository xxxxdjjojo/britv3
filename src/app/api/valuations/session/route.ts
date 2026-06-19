import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, getSessionByToken } from "@/services/valuation/session-repo";
import { VALUATION_SESSION_COOKIE } from "@/lib/valuation/session-token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches session expiry

/** Return the current session (from the cookie), or null. */
export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  const session = token ? await getSessionByToken(token) : null;
  return NextResponse.json({ session });
}

/** Create a new session if one does not already exist; set the httpOnly cookie. */
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VALUATION_SESSION_COOKIE)?.value;
  if (existing && (await getSessionByToken(existing))) {
    return NextResponse.json({ ok: true, existing: true });
  }
  const { token } = await createSession();
  cookieStore.set(VALUATION_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return NextResponse.json({ ok: true, existing: false });
}
