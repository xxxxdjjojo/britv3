import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadPropertyImage,
  uploadFloorPlan,
  deletePropertyImage,
  reorderMedia,
} from "@/services/listings/media-service";

export const maxDuration = 30; // Allow 30s for image processing on Vercel

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/media -- Upload image or floor plan.
 * Accepts multipart form data with file and type field.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: listingId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;

    let result;
    if (type === "floor_plan" || type === "epc_document") {
      result = await uploadFloorPlan(
        supabase,
        user.id,
        listingId,
        buffer,
        filename,
      );
    } else {
      result = await uploadPropertyImage(
        supabase,
        user.id,
        listingId,
        buffer,
        filename,
      );
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload media";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/listings/[id]/media -- Delete a media item.
 * Accepts JSON body with mediaId.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await params; // consume params
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "mediaId is required" },
        { status: 400 },
      );
    }

    await deletePropertyImage(supabase, user.id, mediaId);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PATCH /api/listings/[id]/media -- Reorder media items.
 * Accepts JSON body with ordered mediaIds array.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: listingId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { mediaIds } = body;

    if (!Array.isArray(mediaIds)) {
      return NextResponse.json(
        { error: "mediaIds array is required" },
        { status: 400 },
      );
    }

    await reorderMedia(supabase, user.id, listingId, mediaIds);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reorder media";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
