/**
 * GET /api/search - Property search API route.
 * Validates params with Zod, delegates to search service, caches responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProperties } from "@/services/search/search-service";
import type { SearchSort } from "@/types/search";
import type { EpcRating, PropertyType } from "@/types/property";

const searchParamsSchema = z.object({
  listing_type: z.enum(["sale", "rent"]).optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  min_bedrooms: z.coerce.number().int().min(0).optional(),
  max_bedrooms: z.coerce.number().int().min(0).optional(),
  min_bathrooms: z.coerce.number().int().min(0).optional(),
  property_type: z
    .string()
    .transform((v) => v.split(",") as PropertyType[])
    .optional(),
  epc_rating: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional() as z.ZodOptional<z.ZodType<EpcRating>>,
  new_build: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  amenities: z
    .string()
    .transform((v) => v.split(","))
    .optional(),
  q: z.string().min(1).max(200).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(100).optional(),
  postcode: z.string().optional(),
  sort: z
    .enum(["price_asc", "price_desc", "date_desc", "date_asc", "relevance"])
    .optional() as z.ZodOptional<z.ZodType<SearchSort>>,
  cursor: z.string().uuid().optional(),
  per_page: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawParams: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const parsed = searchParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await searchProperties(parsed.data);

    const response = NextResponse.json(result);

    // Cache popular queries briefly for CDN
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60",
    );

    return response;
  } catch (error) {
    console.error("[search] API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
