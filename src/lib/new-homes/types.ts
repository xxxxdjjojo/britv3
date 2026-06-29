// Domain types for the New Homes / New Build product area.
//
// These are hand-rolled (not yet in the generated database.types.ts — the
// Supabase clients in this repo are untyped, so `.from("developments")` works
// without regen). Regenerate database.types.ts later to fold these in.

export type DevelopmentStatus = "coming_soon" | "available" | "reserved" | "sold_out";

export type DevelopmentSchemeType =
  | "houses"
  | "apartments"
  | "mixed"
  | "retirement"
  | "shared_ownership";

export type DevelopmentUnitStatus = "available" | "reserved" | "sold";

export type DevelopmentMediaType =
  | "image"
  | "floorplan"
  | "site_plan"
  | "brochure"
  | "logo";

export type DevelopmentLeadType =
  | "register_interest"
  | "book_viewing"
  | "request_brochure"
  | "ask_question";

export type DevelopmentLeadStatus =
  | "new"
  | "qualified"
  | "contacted"
  | "viewing_booked"
  | "reserved"
  | "closed"
  | "lost";

export type DevelopmentEventType =
  | "development_viewed"
  | "unit_viewed"
  | "brochure_requested"
  | "enquiry_submitted"
  | "viewing_requested"
  | "viewing_booked"
  | "reservation_requested"
  | "reservation_confirmed";

export interface Developer {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  logoUrl: string | null;
  brandColour: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  yearEstablished: number | null;
  homesBuilt: number | null;
  regions: string[];
}

export interface DevelopmentUnit {
  id: string;
  developmentId: string;
  plotNumber: string;
  unitType: string;
  beds: number;
  baths: number;
  sizeSqft: number | null;
  price: number | null;
  status: DevelopmentUnitStatus;
  floorplanUrl: string | null;
  features: string[];
}

export interface DevelopmentMedia {
  id: string;
  mediaType: DevelopmentMediaType;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface DevelopmentIncentive {
  title: string;
  detail: string;
}

export interface DevelopmentPoi {
  name: string;
  detail: string;
  minutes?: number;
  rating?: string;
}

/** A development as shown on cards/lists (lightweight). */
export interface DevelopmentCard {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  city: string;
  region: string | null;
  postcode: string | null;
  priceMin: number | null;
  priceMax: number | null;
  bedsMin: number | null;
  bedsMax: number | null;
  totalUnits: number | null;
  availableUnits: number | null;
  schemeType: DevelopmentSchemeType;
  status: DevelopmentStatus;
  completionDate: string | null;
  helpToBuy: boolean;
  firstHomes: boolean;
  sharedOwnership: boolean;
  heroImageUrl: string | null;
  developer: Pick<Developer, "id" | "slug" | "name" | "logoUrl" | "brandColour">;
}

/** A full development for the detail page. */
export interface DevelopmentDetail extends DevelopmentCard {
  description: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  incentives: DevelopmentIncentive[];
  highlights: string[];
  transport: DevelopmentPoi[];
  schools: DevelopmentPoi[];
  amenities: DevelopmentPoi[];
  developer: Developer;
  units: DevelopmentUnit[];
  media: DevelopmentMedia[];
}

export interface DevelopmentLead {
  id: string;
  developmentId: string;
  unitId: string | null;
  leadType: DevelopmentLeadType;
  status: DevelopmentLeadStatus;
  name: string;
  email: string;
  phone: string | null;
  buyerStatus: string | null;
  budget: number | null;
  desiredMoveDate: string | null;
  mortgagePosition: string | null;
  hasPropertyToSell: boolean | null;
  preferredPlot: string | null;
  message: string | null;
  sourceRoute: string | null;
  utmSource: string | null;
  createdAt: string;
  developmentName?: string;
}

export interface DevelopmentViewing {
  id: string;
  developmentId: string;
  leadId: string | null;
  unitId: string | null;
  scheduledFor: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}
