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
    latitude?: number;
    longitude?: number;
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
  latitude: number | null;
  longitude: number | null;
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

export type FeedImportReviewItem = {
  id: string;
  external_id: string;
  external_branch_id: string | null;
  status: string;
  validation_errors: string[];
  listing: NormalizedFeedListing;
};

export type FeedImportReview = {
  run: {
    id: string;
    status: string;
    total_items: number;
    eligible_items: number;
    error_items: number;
    published_items: number;
    created_at: string;
  };
  items: FeedImportReviewItem[];
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
      latitude: 51.4998,
      longitude: -0.134,
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
      latitude: 51.5416,
      longitude: -0.114,
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
      latitude: 51.5155,
      longitude: -0.072,
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
    latitude: listing.address.latitude ?? null,
    longitude: listing.address.longitude ?? null,
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

export type FeedSafetyAssessment = {
  safe: boolean;
  reason: string | null;
};

/**
 * Empty-feed safety rule. A full sync that returns zero source records must NOT
 * be allowed to silently withdraw an entire previously-published portfolio.
 * When that happens the run is blocked for explicit human approval instead.
 */
export function assessFeedSafety(input: {
  incomingItemCount: number;
  previouslyPublishedCount: number;
}): FeedSafetyAssessment {
  if (input.incomingItemCount === 0 && input.previouslyPublishedCount > 0) {
    return {
      safe: false,
      reason:
        `Refusing to process an empty feed: ${input.previouslyPublishedCount} ` +
        "previously published listing(s) would be withdrawn. Manual approval required.",
    };
  }

  return { safe: true, reason: null };
}

/**
 * Resolve the organisation that owns a feed integration, so import runs,
 * items, links and published listings are stamped with the org tenant.
 * Returns null for integrations not yet onboarded into the org model.
 */
async function getIntegrationOrganisationId(
  supabase: SupabaseClient,
  integrationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("agent_feed_integrations")
    .select("organisation_id")
    .eq("id", integrationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve integration organisation: ${error.message}`);
  }

  const orgId = (data as { organisation_id?: string | null } | null)?.organisation_id;
  return orgId == null ? null : String(orgId);
}

export async function createDeterministicReapitImportRun(
  supabase: SupabaseClient,
  agentId: string,
  integrationId: string,
): Promise<FeedImportRunSummary> {
  const listings = normalizeReapitFixture();
  const organisationId = await getIntegrationOrganisationId(supabase, integrationId);
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
        organisation_id: organisationId,
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
      organisation_id: organisationId,
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

export async function getFeedImportRunReview(
  supabase: SupabaseClient,
  agentId: string,
  runId: string,
): Promise<FeedImportReview> {
  const { data: run, error: runError } = await supabase
    .from("feed_import_runs")
    .select("*")
    .eq("id", runId)
    .eq("agent_id", agentId)
    .single();

  if (runError || !run) {
    throw new Error(
      `Feed import run not found: ${runError?.message ?? "Unknown error"}`,
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("feed_import_items")
    .select("*")
    .eq("run_id", runId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(`Failed to load feed import items: ${itemsError.message}`);
  }

  return {
    run: {
      id: (run as { id: string }).id,
      status: (run as { status: string }).status,
      total_items: Number((run as { total_items?: number }).total_items ?? 0),
      eligible_items: Number((run as { eligible_items?: number }).eligible_items ?? 0),
      error_items: Number((run as { error_items?: number }).error_items ?? 0),
      published_items: Number((run as { published_items?: number }).published_items ?? 0),
      created_at: String((run as { created_at?: string }).created_at ?? ""),
    },
    items: ((items ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id),
      external_id: String(item.external_id),
      external_branch_id:
        item.external_branch_id == null ? null : String(item.external_branch_id),
      status: String(item.status),
      validation_errors: Array.isArray(item.validation_errors)
        ? (item.validation_errors as string[])
        : [],
      listing: item.normalized_payload as NormalizedFeedListing,
    })),
  };
}

export async function approveEligibleFeedImportRunItems(
  supabase: SupabaseClient,
  agentId: string,
  runId: string,
): Promise<FeedImportReview> {
  const review = await getFeedImportRunReview(supabase, agentId, runId);
  const approvableItems = review.items.filter(
    (item) =>
      item.status === "needs_review" &&
      item.validation_errors.length === 0 &&
      isPublishEligible(item.listing),
  );

  for (const item of approvableItems) {
    await approveFeedImportItem(supabase, agentId, item.id);
  }

  return getFeedImportRunReview(supabase, agentId, runId);
}

type FeedImportItemRow = {
  id: string;
  integration_id: string;
  agent_id: string;
  organisation_id: string | null;
  external_id: string;
  status: string;
  normalized_payload: NormalizedFeedListing;
};

type ExistingListingLink = {
  listing_id: string | null;
  property_id: string | null;
};

/**
 * Resolve a prior canonical listing for this feed record, so re-publishing an
 * already-imported external listing UPDATES it instead of creating a duplicate.
 * Keyed on (integration_id, external_listing_id) — the feed's stable identity.
 */
async function findExistingListingLink(
  supabase: SupabaseClient,
  agentId: string,
  integrationId: string,
  externalListingId: string,
): Promise<ExistingListingLink | null> {
  const { data, error } = await supabase
    .from("feed_listing_links")
    .select("listing_id, property_id")
    .eq("integration_id", integrationId)
    .eq("external_listing_id", externalListingId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve existing feed listing link: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    listing_id: row.listing_id == null ? null : String(row.listing_id),
    property_id: row.property_id == null ? null : String(row.property_id),
  };
}

function propertyValuesFor(listing: NormalizedFeedListing) {
  return {
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
  };
}

/**
 * Publish an approved feed item into canonical property/listing/media tables as
 * a PUBLIC (`active`) listing. Idempotent: a re-published external listing
 * updates its existing canonical rows rather than creating a duplicate. Sets
 * PostGIS coordinates so the listing renders on the map, and refreshes the
 * search materialized view so it is immediately searchable.
 */
export async function publishApprovedImportItem(
  supabase: SupabaseClient,
  agentId: string,
  itemId: string,
): Promise<{ listing_id: string; property_id: string; updated: boolean }> {
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

  const organisationId = feedItem.organisation_id ?? null;
  const existingLink = await findExistingListingLink(
    supabase,
    agentId,
    feedItem.integration_id,
    feedItem.external_id,
  );
  const updated = Boolean(existingLink?.listing_id && existingLink.property_id);

  let propertyId: string;
  let listingId: string;

  if (updated && existingLink) {
    propertyId = existingLink.property_id as string;
    listingId = existingLink.listing_id as string;

    const { error: propertyUpdateError } = await supabase
      .from("properties")
      .update(propertyValuesFor(listing))
      .eq("id", propertyId);
    if (propertyUpdateError) {
      throw new Error(`Failed to update feed property: ${propertyUpdateError.message}`);
    }

    const { error: listingUpdateError } = await supabase
      .from("listings")
      .update({
        listing_type: listing.listing_type,
        price: listing.price,
        rent_frequency: listing.rent_frequency,
        status: "active",
        organisation_id: organisationId,
      })
      .eq("id", listingId)
      .eq("user_id", agentId);
    if (listingUpdateError) {
      throw new Error(`Failed to update feed listing: ${listingUpdateError.message}`);
    }
  } else {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .insert(propertyValuesFor(listing))
      .select()
      .single();

    if (propertyError || !property) {
      throw new Error(
        `Failed to publish feed property: ${propertyError?.message ?? "Unknown error"}`,
      );
    }

    propertyId = (property as { id: string }).id;
    const { data: canonicalListing, error: listingError } = await supabase
      .from("listings")
      .insert({
        property_id: propertyId,
        user_id: agentId,
        organisation_id: organisationId,
        listing_type: listing.listing_type,
        price: listing.price,
        rent_frequency: listing.rent_frequency,
        status: "active",
      })
      .select()
      .single();

    if (listingError || !canonicalListing) {
      throw new Error(
        `Failed to publish feed listing: ${listingError?.message ?? "Unknown error"}`,
      );
    }

    listingId = (canonicalListing as { id: string }).id;
  }

  if (listing.latitude != null && listing.longitude != null) {
    await supabase
      .rpc("set_property_coordinates", {
        p_property_id: propertyId,
        p_lng: listing.longitude,
        p_lat: listing.latitude,
      })
      .then(
        () => undefined,
        () => undefined,
      );
  }

  // Feed is authoritative for media: clear prior feed media then re-insert in
  // source order, so a re-publish reflects upstream reordering without dupes.
  if (updated) {
    await supabase.from("property_media").delete().eq("listing_id", listingId);
  }

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
        organisation_id: organisationId,
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

  await supabase
    .rpc("refresh_search_listings")
    .then(
      () => undefined,
      () => undefined,
    );

  return { listing_id: listingId, property_id: propertyId, updated };
}

export async function publishApprovedFeedImportRunItems(
  supabase: SupabaseClient,
  agentId: string,
  runId: string,
): Promise<{ published_count: number; review: FeedImportReview }> {
  const review = await getFeedImportRunReview(supabase, agentId, runId);
  const approvedItems = review.items.filter((item) => item.status === "approved");
  let publishedCount = 0;

  for (const item of approvedItems) {
    await publishApprovedImportItem(supabase, agentId, item.id);
    publishedCount += 1;
  }

  const { error } = await supabase
    .from("feed_import_runs")
    .update({
      status: "published",
      published_items: review.run.published_items + publishedCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(`Failed to update feed import run: ${error.message}`);
  }

  return {
    published_count: publishedCount,
    review: await getFeedImportRunReview(supabase, agentId, runId),
  };
}

/**
 * Archive canonical listings whose upstream source record was withdrawn. Never
 * destructively deletes — sets status 'archived' (out of public search) while
 * preserving the listing row, the feed link, and the ledger for audit.
 */
export async function archiveWithdrawnFeedListings(
  supabase: SupabaseClient,
  agentId: string,
  runId: string,
): Promise<{ archived_count: number }> {
  const { data: run, error: runError } = await supabase
    .from("feed_import_runs")
    .select("id, integration_id")
    .eq("id", runId)
    .eq("agent_id", agentId)
    .single();

  if (runError || !run) {
    throw new Error(
      `Feed import run not found: ${runError?.message ?? "Unknown error"}`,
    );
  }

  const integrationId = String((run as { integration_id: string }).integration_id);

  const { data: items, error: itemsError } = await supabase
    .from("feed_import_items")
    .select("external_id, status")
    .eq("run_id", runId)
    .eq("agent_id", agentId)
    .eq("status", "withdrawn");

  if (itemsError) {
    throw new Error(`Failed to load withdrawn feed items: ${itemsError.message}`);
  }

  let archivedCount = 0;
  for (const row of (items ?? []) as Array<{ external_id: string }>) {
    const link = await findExistingListingLink(
      supabase,
      agentId,
      integrationId,
      String(row.external_id),
    );
    if (!link?.listing_id) {
      continue;
    }

    const { error: archiveError } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .eq("id", link.listing_id)
      .eq("user_id", agentId);

    if (archiveError) {
      throw new Error(`Failed to archive withdrawn listing: ${archiveError.message}`);
    }

    archivedCount += 1;
  }

  if (archivedCount > 0) {
    await supabase
      .rpc("refresh_search_listings")
      .then(
        () => undefined,
        () => undefined,
      );
  }

  return { archived_count: archivedCount };
}
