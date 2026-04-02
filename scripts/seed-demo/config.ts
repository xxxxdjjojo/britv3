/**
 * Seed Demo — Configuration & Constants
 *
 * Hardcoded demo user UUIDs, property definitions, and scenario types
 * for populating Supabase with realistic demo data.
 */

// ---------------------------------------------------------------------------
// Demo Users
// ---------------------------------------------------------------------------

export const DEMO_PASSWORD = "BritestateDemo2026!";

export const DEMO_USERS = {
  HOMEBUYER: {
    id: "a1b2c3d4-1111-4000-8000-000000000001",
    email: "demo-homebuyer@britestate.test",
    name: "Sarah Mitchell",
    role: "homebuyer" as const,
  },
  RENTER: {
    id: "a1b2c3d4-2222-4000-8000-000000000002",
    email: "demo-renter@britestate.test",
    name: "James Cooper",
    role: "renter" as const,
  },
  SELLER: {
    id: "a1b2c3d4-3333-4000-8000-000000000003",
    email: "demo-seller@britestate.test",
    name: "Emma Thompson",
    role: "seller" as const,
  },
  LANDLORD: {
    id: "a1b2c3d4-4444-4000-8000-000000000004",
    email: "demo-landlord@britestate.test",
    name: "Robert Williams",
    role: "landlord" as const,
  },
  AGENT: {
    id: "a1b2c3d4-5555-4000-8000-000000000005",
    email: "demo-agent@britestate.test",
    name: "Victoria Stone",
    role: "agent" as const,
  },
  PROVIDER: {
    id: "a1b2c3d4-6666-4000-8000-000000000006",
    email: "demo-provider@britestate.test",
    name: "Mike Johnson",
    role: "service_provider" as const,
  },
  ADMIN: {
    id: "a1b2c3d4-7777-4000-8000-000000000007",
    email: "demo-admin@britestate.test",
    name: "Admin User",
    role: "homebuyer" as const,
    isAdmin: true,
  },
} as const;

/** All demo user IDs for cleanup queries */
export const DEMO_USER_IDS: string[] = Object.values(DEMO_USERS).map(
  (u) => u.id,
);

// ---------------------------------------------------------------------------
// Demo User Profile rows (maps to `profiles` table)
// ---------------------------------------------------------------------------

export type DemoUserKey = keyof typeof DEMO_USERS;

export const DEMO_PROFILES: Array<{
  id: string;
  display_name: string;
  active_role: string;
  verification_level: string;
  avatar_url: string | null;
  phone: string;
  phone_verified: boolean;
  is_admin: boolean;
}> = Object.values(DEMO_USERS).map((u) => ({
  id: u.id,
  display_name: u.name,
  active_role: u.role,
  verification_level: "verified",
  avatar_url: null,
  phone: `07${String(Math.floor(100000000 + Math.random() * 899999999)).slice(0, 9)}`,
  phone_verified: true,
  is_admin: "isAdmin" in u && u.isAdmin === true,
}));

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export type Scenario = "happy-path" | "fire-drill" | "growth-mode";

/** Scenario descriptions for logging / CLI help */
export const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  "happy-path":
    "Ideal demo state — active listings, recent messages, good reviews, on-time payments.",
  "fire-drill":
    "Stress-test state — overdue payments, compliance warnings, unread messages, negative reviews.",
  "growth-mode":
    "Growth metrics state — increasing viewings, new leads, multiple offers, rising prices.",
};

// ---------------------------------------------------------------------------
// Property Definitions
// ---------------------------------------------------------------------------

export type PropertyType =
  | "detached"
  | "semi_detached"
  | "terraced"
  | "flat"
  | "bungalow"
  | "land"
  | "cottage"
  | "penthouse"
  | "studio"
  | "maisonette"
  | "other";

export type ListingType = "sale" | "rent";
export type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "sold"
  | "let"
  | "withdrawn"
  | "archived";
export type TenureType = "freehold" | "leasehold" | "shared_ownership";

export interface DemoProperty {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  reception_rooms: number;
  square_footage: number;
  title: string;
  description: string;
  epc_rating: string;
  tenure: TenureType;
  year_built: number;
  new_build: boolean;
  /** Which demo user owns / manages this property */
  owner_key: DemoUserKey;
  /** Whether this is for sale or rent */
  listing_type: ListingType;
  /** Price in GBP (sale price or monthly rent) */
  price: number;
  /** Target listing status in happy-path scenario */
  listing_status: ListingStatus;
}

export const DEMO_PROPERTIES: DemoProperty[] = [
  // ── Sale properties (Seller owns) ─────────────────────────────────────
  {
    id: "b1000001-0001-4000-8000-000000000001",
    address_line1: "14 Rosemary Lane",
    address_line2: null,
    city: "London",
    county: "Greater London",
    postcode: "SW11 3NP",
    property_type: "terraced",
    bedrooms: 3,
    bathrooms: 2,
    reception_rooms: 2,
    square_footage: 1250,
    title: "Charming Victorian Terrace in Battersea",
    description:
      "A beautifully presented three-bedroom Victorian terrace house with original period features throughout. The property benefits from a modern kitchen extension opening onto a south-facing garden, two reception rooms, and a contemporary family bathroom.",
    epc_rating: "C",
    tenure: "freehold",
    year_built: 1895,
    new_build: false,
    owner_key: "SELLER",
    listing_type: "sale",
    price: 875000,
    listing_status: "active",
  },
  {
    id: "b1000001-0002-4000-8000-000000000002",
    address_line1: "Flat 7, The Meridian",
    address_line2: "22 Wharf Road",
    city: "London",
    county: "Greater London",
    postcode: "N1 7GH",
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 1,
    reception_rooms: 1,
    square_footage: 780,
    title: "Modern Canal-Side Apartment in Islington",
    description:
      "A stylish two-bedroom apartment in a sought-after canal-side development. Features include floor-to-ceiling windows, an open-plan living area, integrated kitchen appliances, secure bike storage, and access to communal roof terrace with city views.",
    epc_rating: "B",
    tenure: "leasehold",
    year_built: 2019,
    new_build: false,
    owner_key: "SELLER",
    listing_type: "sale",
    price: 625000,
    listing_status: "under_offer",
  },
  {
    id: "b1000001-0003-4000-8000-000000000003",
    address_line1: "8 Oakfield Drive",
    address_line2: null,
    city: "Manchester",
    county: "Greater Manchester",
    postcode: "M20 6WJ",
    property_type: "semi_detached",
    bedrooms: 4,
    bathrooms: 2.5,
    reception_rooms: 2,
    square_footage: 1650,
    title: "Spacious Semi-Detached in Didsbury",
    description:
      "A substantial four-bedroom semi-detached family home in the heart of Didsbury village. Recently refurbished to a high standard with a bespoke kitchen, utility room, downstairs WC, and large rear garden with patio area. Close to excellent schools and transport links.",
    epc_rating: "C",
    tenure: "freehold",
    year_built: 1935,
    new_build: false,
    owner_key: "SELLER",
    listing_type: "sale",
    price: 485000,
    listing_status: "active",
  },
  {
    id: "b1000001-0004-4000-8000-000000000004",
    address_line1: "The Old Rectory",
    address_line2: "Church Lane",
    city: "Bath",
    county: "Somerset",
    postcode: "BA1 5PQ",
    property_type: "detached",
    bedrooms: 5,
    bathrooms: 3,
    reception_rooms: 3,
    square_footage: 2800,
    title: "Grade II Listed Georgian Rectory near Bath Centre",
    description:
      "An exceptional Grade II listed Georgian rectory set in approximately half an acre of mature gardens. This five-bedroom property retains many original features including sash windows, cornicing, and fireplaces, alongside sympathetic modern updates including underfloor heating and a new Aga kitchen.",
    epc_rating: "D",
    tenure: "freehold",
    year_built: 1780,
    new_build: false,
    owner_key: "SELLER",
    listing_type: "sale",
    price: 1250000,
    listing_status: "active",
  },

  // ── Sale properties (Agent manages) ───────────────────────────────────
  {
    id: "b1000001-0005-4000-8000-000000000005",
    address_line1: "Plot 12, Millbrook Gardens",
    address_line2: null,
    city: "Bristol",
    county: "Bristol",
    postcode: "BS3 4QR",
    property_type: "detached",
    bedrooms: 4,
    bathrooms: 2,
    reception_rooms: 2,
    square_footage: 1500,
    title: "Brand New Detached Home in Bedminster",
    description:
      "A brand new four-bedroom detached house on the exclusive Millbrook Gardens development. The property features an open-plan kitchen/dining area, separate living room, en-suite to the master bedroom, landscaped front garden, and driveway parking for two cars. NHBC warranty included.",
    epc_rating: "A",
    tenure: "freehold",
    year_built: 2026,
    new_build: true,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 550000,
    listing_status: "active",
  },
  {
    id: "b1000001-0006-4000-8000-000000000006",
    address_line1: "Flat 3, Harbour View",
    address_line2: "15 Maritime Crescent",
    city: "Edinburgh",
    county: "City of Edinburgh",
    postcode: "EH6 6SB",
    property_type: "penthouse",
    bedrooms: 3,
    bathrooms: 2,
    reception_rooms: 1,
    square_footage: 1200,
    title: "Stunning Penthouse with Harbour Views in Leith",
    description:
      "A magnificent three-bedroom penthouse apartment with panoramic views across Leith harbour. This top-floor property features a wraparound balcony, bespoke Italian kitchen, underfloor heating throughout, and secure underground parking. Lift access to all floors.",
    epc_rating: "B",
    tenure: "leasehold",
    year_built: 2022,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 725000,
    listing_status: "active",
  },
  {
    id: "b1000001-0007-4000-8000-000000000007",
    address_line1: "2 Elm Cottage",
    address_line2: "High Street",
    city: "Henley-on-Thames",
    county: "Oxfordshire",
    postcode: "RG9 2AA",
    property_type: "cottage",
    bedrooms: 2,
    bathrooms: 1,
    reception_rooms: 1,
    square_footage: 850,
    title: "Quintessential English Cottage in Henley",
    description:
      "A picture-perfect two-bedroom thatched cottage in the heart of Henley-on-Thames. Exposed beams, inglenook fireplace, and a cottage garden with views towards the river. Recently updated with new plumbing and electrics while preserving its 17th-century character.",
    epc_rating: "D",
    tenure: "freehold",
    year_built: 1680,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 595000,
    listing_status: "sold",
  },

  // ── Rental properties (Landlord owns) ─────────────────────────────────
  {
    id: "b1000001-0008-4000-8000-000000000008",
    address_line1: "Flat 12, Crescent House",
    address_line2: "45 Park Road",
    city: "London",
    county: "Greater London",
    postcode: "W2 4RH",
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 1,
    reception_rooms: 1,
    square_footage: 720,
    title: "Bright Two-Bed Flat near Hyde Park",
    description:
      "A well-presented two-bedroom apartment moments from Hyde Park and Paddington station. The property offers a bright reception room, modern fitted kitchen, two double bedrooms, and a family bathroom. Furnished to a high standard with new carpets throughout.",
    epc_rating: "C",
    tenure: "leasehold",
    year_built: 1970,
    new_build: false,
    owner_key: "LANDLORD",
    listing_type: "rent",
    price: 2200,
    listing_status: "let",
  },
  {
    id: "b1000001-0009-4000-8000-000000000009",
    address_line1: "28 Victoria Terrace",
    address_line2: null,
    city: "Leeds",
    county: "West Yorkshire",
    postcode: "LS3 1BQ",
    property_type: "terraced",
    bedrooms: 3,
    bathrooms: 1.5,
    reception_rooms: 1,
    square_footage: 950,
    title: "Student-Friendly Terrace in Headingley",
    description:
      "A well-maintained three-bedroom terraced house ideal for students or young professionals. Located in the popular Headingley area, close to the University of Leeds. The property features a modern kitchen, downstairs WC, rear courtyard garden, and gas central heating.",
    epc_rating: "D",
    tenure: "freehold",
    year_built: 1910,
    new_build: false,
    owner_key: "LANDLORD",
    listing_type: "rent",
    price: 1100,
    listing_status: "active",
  },
  {
    id: "b1000001-0010-4000-8000-000000000010",
    address_line1: "Apartment 4B",
    address_line2: "The Waterfront, Salford Quays",
    city: "Manchester",
    county: "Greater Manchester",
    postcode: "M50 3AZ",
    property_type: "flat",
    bedrooms: 1,
    bathrooms: 1,
    reception_rooms: 1,
    square_footage: 520,
    title: "Contemporary One-Bed at Salford Quays",
    description:
      "A modern one-bedroom apartment with waterfront views in the vibrant Salford Quays development. Open-plan living with a Juliet balcony, integrated kitchen appliances, allocated parking space, and access to a residents gym and concierge service.",
    epc_rating: "B",
    tenure: "leasehold",
    year_built: 2020,
    new_build: false,
    owner_key: "LANDLORD",
    listing_type: "rent",
    price: 950,
    listing_status: "active",
  },
  {
    id: "b1000001-0011-4000-8000-000000000011",
    address_line1: "5 Meadow Close",
    address_line2: null,
    city: "Birmingham",
    county: "West Midlands",
    postcode: "B15 2TT",
    property_type: "semi_detached",
    bedrooms: 3,
    bathrooms: 2,
    reception_rooms: 2,
    square_footage: 1100,
    title: "Family Semi in Edgbaston with Garden",
    description:
      "A spacious three-bedroom semi-detached house in the desirable Edgbaston area. Features include a large through-lounge, separate dining room, fitted kitchen with breakfast bar, family bathroom, en-suite shower, and an enclosed rear garden with shed.",
    epc_rating: "C",
    tenure: "freehold",
    year_built: 1955,
    new_build: false,
    owner_key: "LANDLORD",
    listing_type: "rent",
    price: 1350,
    listing_status: "active",
  },

  // ── Rental properties (Agent manages for landlord) ────────────────────
  {
    id: "b1000001-0012-4000-8000-000000000012",
    address_line1: "Studio 9, The Glassworks",
    address_line2: "50 Spencer Street",
    city: "Birmingham",
    county: "West Midlands",
    postcode: "B18 6DA",
    property_type: "studio",
    bedrooms: 0,
    bathrooms: 1,
    reception_rooms: 0,
    square_footage: 350,
    title: "City Centre Studio in the Jewellery Quarter",
    description:
      "A compact studio apartment in a converted glassworks building in Birminghams historic Jewellery Quarter. The open-plan space includes a sleeping area, kitchen alcove, and modern shower room. Bills included in rent. Ideal for young professionals.",
    epc_rating: "C",
    tenure: "leasehold",
    year_built: 2018,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "rent",
    price: 750,
    listing_status: "active",
  },
  {
    id: "b1000001-0013-4000-8000-000000000013",
    address_line1: "17 Queens Gate",
    address_line2: null,
    city: "London",
    county: "Greater London",
    postcode: "SW7 5JE",
    property_type: "maisonette",
    bedrooms: 3,
    bathrooms: 2,
    reception_rooms: 2,
    square_footage: 1400,
    title: "Elegant Maisonette in South Kensington",
    description:
      "A beautifully appointed three-bedroom maisonette arranged over two floors in a prestigious South Kensington terrace. Period features include high ceilings, ornate cornicing, and a marble fireplace. Private entrance, patio garden, and access to communal gardens.",
    epc_rating: "D",
    tenure: "leasehold",
    year_built: 1860,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "rent",
    price: 4500,
    listing_status: "active",
  },

  // ── Additional sale properties ────────────────────────────────────────
  {
    id: "b1000001-0014-4000-8000-000000000014",
    address_line1: "Hilltop Farm",
    address_line2: "Moorland Road",
    city: "Whitby",
    county: "North Yorkshire",
    postcode: "YO21 1RN",
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 1,
    reception_rooms: 2,
    square_footage: 1050,
    title: "Detached Bungalow with Sea Views near Whitby",
    description:
      "A detached three-bedroom bungalow enjoying spectacular views over the North Yorkshire Moors and glimpses of the sea. Set in a generous plot with wrap-around garden, detached garage, and ample off-road parking. Oil-fired central heating and double glazing throughout.",
    epc_rating: "E",
    tenure: "freehold",
    year_built: 1972,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 325000,
    listing_status: "active",
  },
  {
    id: "b1000001-0015-4000-8000-000000000015",
    address_line1: "Flat 22, Deansgate Towers",
    address_line2: "100 Deansgate",
    city: "Manchester",
    county: "Greater Manchester",
    postcode: "M3 2GP",
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 2,
    reception_rooms: 1,
    square_footage: 900,
    title: "Luxury City Centre Apartment on Deansgate",
    description:
      "A luxurious two-bedroom apartment in the iconic Deansgate Towers development. Floor-to-ceiling windows offer stunning city skyline views. The property includes a high-spec kitchen with Siemens appliances, two en-suite bedrooms, and 24-hour concierge.",
    epc_rating: "B",
    tenure: "leasehold",
    year_built: 2023,
    new_build: false,
    owner_key: "SELLER",
    listing_type: "sale",
    price: 420000,
    listing_status: "draft",
  },
  {
    id: "b1000001-0016-4000-8000-000000000016",
    address_line1: "3 Harbour Mews",
    address_line2: null,
    city: "Falmouth",
    county: "Cornwall",
    postcode: "TR11 3QY",
    property_type: "terraced",
    bedrooms: 2,
    bathrooms: 1,
    reception_rooms: 1,
    square_footage: 680,
    title: "Character Fishermans Cottage in Falmouth Harbour",
    description:
      "A delightful two-bedroom fishermans cottage tucked away in a quiet mews just steps from Falmouth harbour. Retaining much of its original character with stone walls and timber beams, the property has been tastefully updated with a contemporary kitchen and modern bathroom.",
    epc_rating: "D",
    tenure: "freehold",
    year_built: 1820,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 385000,
    listing_status: "active",
  },
  {
    id: "b1000001-0017-4000-8000-000000000017",
    address_line1: "Land Adjacent to Oak Farm",
    address_line2: "Station Road",
    city: "Guildford",
    county: "Surrey",
    postcode: "GU1 4UT",
    property_type: "land",
    bedrooms: 0,
    bathrooms: 0,
    reception_rooms: 0,
    square_footage: 0,
    title: "Residential Building Plot with Planning Permission",
    description:
      "A level building plot of approximately 0.3 acres with full planning permission for a four-bedroom detached dwelling. All services available to the boundary. Desirable semi-rural location within easy reach of Guildford town centre and A3.",
    epc_rating: "N",
    tenure: "freehold",
    year_built: 0,
    new_build: false,
    owner_key: "AGENT",
    listing_type: "sale",
    price: 450000,
    listing_status: "active",
  },
];

/** All demo property IDs for cleanup queries */
export const DEMO_PROPERTY_IDS: string[] = DEMO_PROPERTIES.map((p) => p.id);
