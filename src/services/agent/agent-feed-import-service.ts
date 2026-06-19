import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ListingType,
  PlanningPermissionStatus,
  PropertyType,
  RentFrequency,
  TenureType,
} from "@/types/property";

type ReapitFixtureListing = {
  id: string;
  branchId: string;
  selling?: { price?: number };
  letting?: { rent?: number; rentFrequency?: RentFrequency };
  status: "forSale" | "toLet" | "withdrawn";
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    postcode?: string;
  };
  property: {
    type?: PropertyType;
    bedrooms?: number;
    bathrooms?: number;
    receptionRooms?: number;
    floorAreaSqFt?: number;
    tenure?: TenureType;
    planningPermissionStatus?: PlanningPermissionStatus;
  };
  marketing: {
    title?: string;
    description?: string;
    features?: string[];
  };
  media: Array<{
    id: string;
    url: string;
    caption?: string;
    sortOrder: number;
  }>;
};

export type NormalizedFeedListing = {
  source: "reapit";
  external_id: string;
  external_branch_id: string;
  status: "available" | "withdrawn";
  listing_type: ListingType;
  price: number;
  rent_frequency: RentFrequency | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  reception_rooms: number | null;
  square_footage: number | null;
  title: string;
  description: string;
  features: Record<string, unknown>;
  tenure: TenureType | null;
  planning_permission_status: PlanningPermissionStatus | null;
  media: Array<{
    external_id: string;
    url: string;
    caption: string | null;
    sort_order: number;
  }>;
  raw_payload: ReapitFixtureListing;
};

export type FeedImportRunSummary = {
  run_id: string;
  total_items: number;
  eligible_items: number;
  error_items: number;
  withdrawn_items: number;
};

const REAPIT_FIXTURE: ReapitFixtureListing[] = [
  {
    id: "RPT-1001",
    branchId: "LDN-CEN",
    status: "forSale",
    selling: { price: 650000 },
    address: {
      line1: "12 Queen Street",
      city: "London",
      postcode: "SW1A 1AA",
    },
    property: {
      type: "flat",
      bedrooms: 2,
      bathrooms: 1,
      receptionRooms: 1,
      floorAreaSqFt: 780,
      tenure: "leasehold",
      planningPermissionStatus: "none_known",
    },
    marketing: {
      title: "Two bedroom apartment near St James's Park",
      description:
        "A well presented apartment with strong transport links and managed communal areas.",
      features: ["Balcony", "Lift", "Concierge"],
    },
    media: [
      {
        id: "RPT-1001-IMG-1",
        url: "https://images.example.test/reapit/rpt-1001-front.jpg",
        caption: "Front elevation",
        sortOrder: 0,
      },
    ],
  },
  {
    id: "RPT-1002",
    branchId: "LDN-CEN",
    status: "forSale",
    selling: { price: 925000 },
    address: {
      line1: "44 Market Road",
      city: "London",
      postcode: "N1 9AB",
    },
    property: {
      type: "terraced",
      bedrooms: 3,
      bathrooms: 2,
      receptionRooms: 2,
      floorAreaSqFt: 1175,
      tenure: "freehold",
    },
    marketing: {
      title: "Three bedroom terrace with garden",
      description:
        "A period home close to local shops, with retained features and a private garden.",
      features: ["Garden", "Cellar"],
    },
    media: [],
  },
  {
    id: "RPT-1003",
    branchId: "LDN-CEN",
    status: "withdrawn",
    selling: { price: 500000 },
    address: {
      line1: "8 Removed Close",
      city: "London",
      postcode: "E1 1AA",
    },
    property: {
      type: "flat",
      bedrooms: 1,
      bathrooms: 1,
    },
    marketing: {
      title: "Withdrawn one bedroom flat",
      description: "This listing has been withdrawn at source.",
    },
    media: [],
  },
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function normalizeReapitListing(listing: ReapitFixtureListing): NormalizedFeedListing {
  const listingType: ListingType = listing.status === "toLet" ? "rent" : "sale";
  const price =
    listingType === "rent"
      ? (listing.letting?.rent ?? 0)
      : (listing.selling?.price ?? 0);

  return {
    source: "reapit",
    external_id: listing.id,
    external_branch_id: listing.branchId,
    status: listing.status === "withdrawn" ? "withdrawn" : "available",
    listing_type: listingType,
    price,
    rent_frequency:
      listingType === "rent" ? (listing.letting?.rentFrequency ?? "monthly") : null,
    address_line1: listing.address.line1 ?? "",
    address_line2: listing.address.line2 ?? null,
    city: listing.address.city ?? "",
    postcode: listing.address.postcode ?? "",
    property_type: listing.property.type ?? "other",
    bedrooms: listing.property.bedrooms ?? 0,
    bathrooms: listing.property.bathrooms ?? 0,
    reception_rooms: listing.property.receptionRooms ?? null,
    square_footage: listing.property.floorAreaSqFt ?? null,
    title: listing.marketing.title ?? "",
    description: listing.marketing.description ?? "",
    features: { feed_features: listing.marketing.features ?? [] },
    tenure: listing.property.tenure ?? null,
    planning_permission_status:
      listing.property.planningPermissionStatus ?? null,
    media: listing.media.map((item) => ({
      external_id: item.id,
      url: item.url,
      caption: item.caption ?? null,
      sort_order: item.sortOrder,
    })),
    raw_payload: listing,
  };
}

export function normalizeReapitFixture(): NormalizedFeedListing[] {
  return REAPIT_FIXTURE.map(normalizeReapitListing);
}

export function validateNormalizedListing(listing: NormalizedFeedListing): string[] {
  if (listing.status === "withdrawn") {
    return [];
  }

  const errors: string[] = [];

  for (const [field, value] of Object.entries({
    address_line1: listing.address_line1,
    city: listing.city,
    postcode: listing.postcode,
    property_type: listing.property_type,
    title: listing.title,
    description: listing.description,
    tenure: listing.tenure,
    planning_permission_status: listing.planning_permission_status,
  })) {
    if (value === null || value === undefined || value === "") {
      errors.push(`${field} is required`);
    }
  }

  if (listing.price <= 0) {
    errors.push("price must be greater than 0");
  }

  if (listing.bedrooms < 0) {
    errors.push("bedrooms must be zero or greater");
  }

  if (listing.bathrooms < 0) {
    errors.push("bathrooms must be zero or greater");
  }

  if (listing.listing_type === "rent" && !listing.rent_frequency) {
    errors.push("rent_frequency is required for rental listings");
  }

  return errors;
}

export function isPublishEligible(listing: NormalizedFeedListing): boolean {
  return listing.status === "available" && validateNormalizedListing(listing).length === 0;
}

export async function createDeterministicReapitImportRun(
  supabase: SupabaseClient,
  agentId: string,
  integrationId: string,
): Promise<FeedImportRunSummary> {
  const listings = normalizeReapitFixture();
  const sourceFingerprint = sha256(listings.map((listing) => listing.raw_payload));
  const eligibleItems = listings.filter(isPublishEligible).length;
  const errorItems = listings.filter(
    (listing) => validateNormalizedListing(listing).length > 0,
  ).length;
  const withdrawnItems = listings.filter((listing) => listing.status === "withdrawn").length;

  const { data: run, error: runError } = await supabase
    .from("feed_import_runs")
    .upsert(
      {
        integration_id: integrationId,
        agent_id: agentId,
        provider: "reapit",
        source_fingerprint: sourceFingerprint,
        status: "needs_review",
        total_items: listings.length,
        eligible_items: eligibleItems,
        error_items: errorItems,
      },
      { onConflict: "integration_id,source_fingerprint" },
    )
    .select()
    .single();

  if (runError || !run) {
    throw new Error(
      `Failed to create feed import run: ${runError?.message ?? "Unknown error"}`,
    );
  }

  const runId = (run as { id: string }).id;
  const itemRows = listings.map((listing) => {
    const validationErrors = validateNormalizedListing(listing);

    return {
      run_id: runId,
      integration_id: integrationId,
      agent_id: agentId,
      item_type: "listing",
      external_id: listing.external_id,
      external_branch_id: listing.external_branch_id,
      payload: listing.raw_payload,
      normalized_payload: listing,
      payload_sha256: sha256(listing.raw_payload),
      status: listing.status === "withdrawn" ? "withdrawn" : "needs_review",
      validation_errors: validationErrors,
    };
  });

  const { error: itemError } = await supabase
    .from("feed_import_items")
    .upsert(itemRows, { onConflict: "run_id,item_type,external_id" });

  if (itemError) {
    throw new Error(`Failed to upsert feed import items: ${itemError.message}`);
  }

  return {
    run_id: runId,
    total_items: listings.length,
    eligible_items: eligibleItems,
    error_items: errorItems,
    withdrawn_items: withdrawnItems,
  };
}

export async function approveFeedImportItem(
  supabase: SupabaseClient,
  agentId: string,
  itemId: string,
) {
  const { data, error } = await supabase
    .from("feed_import_items")
    .update({ status: "approved" })
    .eq("id", itemId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve feed import item: ${error.message}`);
  }

  return data;
}

type FeedImportItemRow = {
  id: string;
  integration_id: string;
  agent_id: string;
  external_id: string;
  status: string;
  normalized_payload: NormalizedFeedListing;
};

export async function publishApprovedImportItem(
  supabase: SupabaseClient,
  agentId: string,
  itemId: string,
): Promise<{ listing_id: string; property_id: string }> {
  const { data: item, error: itemError } = await supabase
    .from("feed_import_items")
    .select("*")
    .eq("id", itemId)
    .eq("agent_id", agentId)
    .single();

  if (itemError || !item) {
    throw new Error(
      `Feed import item not found: ${itemError?.message ?? "Unknown error"}`,
    );
  }

  const feedItem = item as FeedImportItemRow;
  if (feedItem.status !== "approved") {
    throw new Error("Only approved feed import items can be published");
  }

  const listing = feedItem.normalized_payload;
  const validationErrors = validateNormalizedListing(listing);
  if (!isPublishEligible(listing)) {
    throw new Error(`Feed import item is not publishable: ${validationErrors.join(", ")}`);
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      address_line1: listing.address_line1,
      address_line2: listing.address_line2,
      city: listing.city,
      postcode: listing.postcode,
      property_type: listing.property_type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      reception_rooms: listing.reception_rooms,
      square_footage: listing.square_footage,
      title: listing.title,
      description: listing.description,
      features: listing.features,
      tenure: listing.tenure,
      planning_permission_status: listing.planning_permission_status,
    })
    .select()
    .single();

  if (propertyError || !property) {
    throw new Error(
      `Failed to publish feed property: ${propertyError?.message ?? "Unknown error"}`,
    );
  }

  const propertyId = (property as { id: string }).id;
  const { data: canonicalListing, error: listingError } = await supabase
    .from("listings")
    .insert({
      property_id: propertyId,
      user_id: agentId,
      listing_type: listing.listing_type,
      price: listing.price,
      rent_frequency: listing.rent_frequency,
      status: "draft",
    })
    .select()
    .single();

  if (listingError || !canonicalListing) {
    throw new Error(
      `Failed to publish feed listing: ${listingError?.message ?? "Unknown error"}`,
    );
  }

  const listingId = (canonicalListing as { id: string }).id;

  if (listing.media.length > 0) {
    const { error: mediaError } = await supabase.from("property_media").insert(
      listing.media.map((media) => ({
        listing_id: listingId,
        media_type: "image",
        url: media.url,
        caption: media.caption,
        alt_text: media.caption ?? listing.title,
        sort_order: media.sort_order,
        uploaded_by: agentId,
      })),
    );

    if (mediaError) {
      throw new Error(`Failed to publish feed media: ${mediaError.message}`);
    }
  }

  const { error: listingLinkError } = await supabase
    .from("feed_listing_links")
    .upsert(
      {
        integration_id: feedItem.integration_id,
        agent_id: agentId,
        external_listing_id: feedItem.external_id,
        listing_id: listingId,
        property_id: propertyId,
      },
      { onConflict: "integration_id,external_listing_id" },
    );

  if (listingLinkError) {
    throw new Error(`Failed to link feed listing: ${listingLinkError.message}`);
  }

  if (listing.media.length > 0) {
    const { error: mediaLinkError } = await supabase
      .from("feed_media_links")
      .upsert(
        listing.media.map((media) => ({
          integration_id: feedItem.integration_id,
          agent_id: agentId,
          external_media_id: media.external_id,
          listing_id: listingId,
          source_url: media.url,
        })),
        { onConflict: "integration_id,listing_id,external_media_id" },
      );

    if (mediaLinkError) {
      throw new Error(`Failed to link feed media: ${mediaLinkError.message}`);
    }
  }

  const { error: updateError } = await supabase
    .from("feed_import_items")
    .update({ status: "published", canonical_listing_id: listingId })
    .eq("id", feedItem.id)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to mark feed item as published: ${updateError.message}`);
  }

  return { listing_id: listingId, property_id: propertyId };
}
