import type { EpcRating } from "@/types/property";
import type {
  PropertyDetail,
  PriceHistoryEntry,
} from "@/services/properties/property-detail-service";
import { extractFeatureItems } from "@/lib/properties/extract-features";
import { buildPropertyFacts } from "@/lib/properties/build-property-facts";
import { groupImagesByRoom } from "@/lib/properties/group-images-by-room";
import { perWeek, perRoom } from "@/lib/properties/rental-cost";
import { formatWeeklyRent } from "@/lib/properties/rental-format";

// ---------------------------------------------------------------------------
// Property view model
// ---------------------------------------------------------------------------
// `buildPropertyView` centralises every derived display value the Buy and Rent
// templates need, so the two templates stay thin and share one source of truth.
// It is pure: no per-user state, no Supabase, no network. Per-user state
// (save/viewing/auth) is computed in the page and passed separately as
// `PropertyViewerState`.

/** Title-case an underscore-delimited enum, e.g. "semi_detached" → "Semi Detached". */
export function formatPropertyType(raw: string): string {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPriceHistory(
  rows: PriceHistoryEntry[],
): { date: string; price: number; event?: string }[] {
  return rows.map((row, i) => ({
    date: String(row.changedAt).slice(0, 10),
    price: row.newPrice,
    event:
      i === rows.length - 1
        ? "Listed"
        : row.newPrice < row.oldPrice
          ? "Reduced"
          : undefined,
  }));
}

/** Extract the postcode district prefix, e.g. "TW7 9AB" → "TW7". */
function postcodeDistrict(postcode: string): string {
  return postcode.trim().split(" ")[0] ?? postcode.trim();
}

export type PropertyView = {
  detail: PropertyDetail;
  isInactiveStatus: boolean;
  address: string;
  priceFormatted: string;
  monthlyRent: number;
  rentSubline: string;
  sqft: number;
  propertyTypeLabel: string;
  epc: EpcRating | "N/A";
  features: string[];
  galleryImages: { src: string; alt: string }[];
  roomGroups: ReturnType<typeof groupImagesByRoom>;
  factGroups: ReturnType<typeof buildPropertyFacts>;
  showMap: boolean;
  floors: { label: string; imageUrl: string }[];
  priceHistoryFormatted: { date: string; price: number; event?: string }[];
  priceReduced: boolean;
  originalPrice: number | null;
  floorPlanUrl: string | null;
  virtualTourUrl: string | null;
  videoTourUrl: string | null;
  district: string;
  propertyUrl: string;
  propertyTitle: string;
};

/** Per-user state — computed in the page (needs Supabase auth), not here. */
export type PropertyViewerState = {
  viewerCount: number;
  saveState: { saved: boolean; notes: string | null };
  currentUserId: string | null;
  existingViewingId: string | null;
  saveCount: number;
  canBookViewing: boolean;
};

export function buildPropertyView(
  detail: PropertyDetail,
  priceHistory: PriceHistoryEntry[],
): PropertyView {
  const { listing, property, media } = detail;

  const isInactiveStatus = ["sold", "sold_stc", "let", "withdrawn"].includes(
    listing.status,
  );

  const address = [
    property.addressLine1,
    property.addressLine2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const rentSuffix =
    listing.listingType === "rent"
      ? ` ${listing.rentFrequency === "weekly" ? "pw" : "pcm"}`
      : "";
  const priceFormatted = `£${listing.price.toLocaleString("en-GB")}${rentSuffix}`;

  // Monthly rent — derived for weekly listings (mirrors RentalLettingDetails).
  const monthlyRent =
    listing.rentFrequency === "weekly"
      ? Math.round(listing.price * (52 / 12))
      : listing.price;

  // Per-week / per-room sub-line under the price (rent only).
  const perWeekStr = formatWeeklyRent(perWeek(monthlyRent));
  const perRoomValue =
    property.bedrooms >= 1 ? perRoom(monthlyRent, property.bedrooms) : null;
  const perRoomStr =
    perRoomValue != null
      ? `£${perRoomValue.toLocaleString("en-GB")} pcm / room`
      : "";
  const rentSubline = [perWeekStr, perRoomStr].filter(Boolean).join(" · ");

  const sqft = property.squareFootage ?? 0;
  const propertyTypeLabel = formatPropertyType(property.propertyType);
  const epc: EpcRating | "N/A" = (property.epcRating as EpcRating | null) ?? "N/A";
  const features = extractFeatureItems(property.features);

  const images = media
    .filter((m) => m.mediaType === "image")
    .map((m) => ({ src: m.url, alt: m.altText ?? "", caption: m.caption ?? null }));
  const galleryImages = images.map(({ src, alt }) => ({ src, alt }));
  const roomGroups = groupImagesByRoom(images);

  const factGroups = buildPropertyFacts(property, listing);

  const showMap =
    property.coordinates != null &&
    Boolean(process.env.NEXT_PUBLIC_MAPTILER_API_KEY);

  const floors = media
    .filter((m) => m.mediaType === "floor_plan")
    .map((m) => ({ label: m.caption ?? "Floor Plan", imageUrl: m.url }));

  const priceHistoryFormatted = formatPriceHistory([...priceHistory].reverse());

  const priceReduced =
    priceHistoryFormatted.length > 1 &&
    priceHistoryFormatted[priceHistoryFormatted.length - 1].price <
      priceHistoryFormatted[0].price;
  const originalPrice = priceReduced ? priceHistoryFormatted[0].price : null;

  const floorPlanUrl = floors.length > 0 ? (floors[0]?.imageUrl ?? null) : null;

  const virtualTourUrl =
    media.find((m) => (m.mediaType as string) === "virtual_tour")?.url ?? null;
  const videoTourUrl =
    media.find((m) => (m.mediaType as string) === "video")?.url ?? null;

  const district = postcodeDistrict(property.postcode);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://truedeed.co.uk";
  const propertyUrl = `${baseUrl}/properties/${listing.slug ?? listing.id}`;
  const propertyTitle = `${property.bedrooms}-bed ${propertyTypeLabel} in ${property.city}`;

  return {
    detail,
    isInactiveStatus,
    address,
    priceFormatted,
    monthlyRent,
    rentSubline,
    sqft,
    propertyTypeLabel,
    epc,
    features,
    galleryImages,
    roomGroups,
    factGroups,
    showMap,
    floors,
    priceHistoryFormatted,
    priceReduced,
    originalPrice,
    floorPlanUrl,
    virtualTourUrl,
    videoTourUrl,
    district,
    propertyUrl,
    propertyTitle,
  };
}
