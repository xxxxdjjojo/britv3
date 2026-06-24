import { NextResponse, type NextRequest } from "next/server";

import { getQueueStatus } from "@/services/waitlist/waitlist-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await params;
  const status = await getQueueStatus(code);
  if (!status) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(status);
}
