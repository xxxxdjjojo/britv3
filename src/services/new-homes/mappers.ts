// Row → domain mappers for the New Homes tables. The Supabase clients are
// untyped here, so rows arrive as loose records; we map them into the strict
// domain types from src/lib/new-homes/types.ts at the service boundary.

import type {
  Developer,
  DevelopmentCard,
  DevelopmentDetail,
  DevelopmentIncentive,
  DevelopmentLead,
  DevelopmentMedia,
  DevelopmentPoi,
  DevelopmentUnit,
  DevelopmentViewing,
} from "@/lib/new-homes/types";

type Row = Record<string, unknown>;

const asString = (v: unknown): string | null => (typeof v === "string" ? v : null);
const asNumber = (v: unknown): number | null =>
  typeof v === "number" ? v : v == null ? null : Number(v) || null;
const asBool = (v: unknown): boolean => v === true;
const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function mapDeveloper(row: Row): Developer {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: asString(row.tagline),
    about: asString(row.about),
    logoUrl: asString(row.logo_url),
    brandColour: asString(row.brand_colour),
    websiteUrl: asString(row.website_url),
    contactEmail: asString(row.contact_email),
    contactPhone: asString(row.contact_phone),
    yearEstablished: asNumber(row.year_established),
    homesBuilt: asNumber(row.homes_built),
    regions: asArray<string>(row.regions),
  };
}

export function mapUnit(row: Row): DevelopmentUnit {
  return {
    id: String(row.id),
    developmentId: String(row.development_id),
    plotNumber: String(row.plot_number),
    unitType: String(row.unit_type),
    beds: asNumber(row.beds) ?? 0,
    baths: asNumber(row.baths) ?? 0,
    sizeSqft: asNumber(row.size_sqft),
    price: asNumber(row.price),
    status: (row.status as DevelopmentUnit["status"]) ?? "available",
    floorplanUrl: asString(row.floorplan_url),
    features: asArray<string>(row.features),
  };
}

export function mapMedia(row: Row): DevelopmentMedia {
  return {
    id: String(row.id),
    mediaType: (row.media_type as DevelopmentMedia["mediaType"]) ?? "image",
    url: String(row.url),
    caption: asString(row.caption),
    sortOrder: asNumber(row.sort_order) ?? 0,
  };
}

function developerSummary(row: Row): DevelopmentCard["developer"] {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    logoUrl: asString(row.logo_url),
    brandColour: asString(row.brand_colour),
  };
}

export function mapDevelopmentCard(row: Row, developerRow: Row): DevelopmentCard {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    summary: asString(row.summary),
    city: String(row.city),
    region: asString(row.region),
    postcode: asString(row.postcode),
    priceMin: asNumber(row.price_min),
    priceMax: asNumber(row.price_max),
    bedsMin: asNumber(row.beds_min),
    bedsMax: asNumber(row.beds_max),
    totalUnits: asNumber(row.total_units),
    availableUnits: asNumber(row.available_units),
    schemeType: (row.scheme_type as DevelopmentCard["schemeType"]) ?? "mixed",
    status: (row.status as DevelopmentCard["status"]) ?? "available",
    completionDate: asString(row.completion_date),
    helpToBuy: asBool(row.help_to_buy),
    firstHomes: asBool(row.first_homes),
    sharedOwnership: asBool(row.shared_ownership),
    heroImageUrl: asString(row.hero_image_url),
    developer: developerSummary(developerRow),
  };
}

export function mapDevelopmentDetail(
  row: Row,
  developerRow: Row,
  units: Row[],
  media: Row[],
): DevelopmentDetail {
  return {
    ...mapDevelopmentCard(row, developerRow),
    description: asString(row.description),
    addressLine: asString(row.address_line),
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    incentives: asArray<DevelopmentIncentive>(row.incentives),
    highlights: asArray<string>(row.highlights),
    transport: asArray<DevelopmentPoi>(row.transport),
    schools: asArray<DevelopmentPoi>(row.schools),
    amenities: asArray<DevelopmentPoi>(row.amenities),
    developer: mapDeveloper(developerRow),
    units: units.map(mapUnit),
    media: media.map(mapMedia),
  };
}

export function mapLead(row: Row): DevelopmentLead {
  return {
    id: String(row.id),
    developmentId: String(row.development_id),
    unitId: asString(row.unit_id),
    leadType: (row.lead_type as DevelopmentLead["leadType"]) ?? "register_interest",
    status: (row.status as DevelopmentLead["status"]) ?? "new",
    name: String(row.name),
    email: String(row.email),
    phone: asString(row.phone),
    buyerStatus: asString(row.buyer_status),
    budget: asNumber(row.budget),
    desiredMoveDate: asString(row.desired_move_date),
    mortgagePosition: asString(row.mortgage_position),
    hasPropertyToSell:
      typeof row.has_property_to_sell === "boolean" ? row.has_property_to_sell : null,
    preferredPlot: asString(row.preferred_plot),
    message: asString(row.message),
    sourceRoute: asString(row.source_route),
    utmSource: asString(row.utm_source),
    createdAt: String(row.created_at),
  };
}

export function mapViewing(row: Row): DevelopmentViewing {
  return {
    id: String(row.id),
    developmentId: String(row.development_id),
    leadId: asString(row.lead_id),
    unitId: asString(row.unit_id),
    scheduledFor: asString(row.scheduled_for),
    status: String(row.status),
    notes: asString(row.notes),
    createdAt: String(row.created_at),
  };
}
