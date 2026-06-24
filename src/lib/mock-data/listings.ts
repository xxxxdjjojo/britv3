/**
 * Canonical mock-listings dataset.
 *
 * This is the SINGLE SOURCE OF TRUTH for mock listings that feed BOTH the
 * property-search page (via `getMockSearchProperties`) and the property-detail
 * page (via `getMockListingBySlug` + `toPropertyDetail`).
 *
 * Dependency arrow is ONE-WAY: consumers (search action, detail service) import
 * from here. This module imports `PropertyDetail` and `SearchProperty` only as
 * TYPES — never any runtime value from those modules — so there is no cycle.
 */

import type { PropertyDetail } from "@/services/properties/property-detail-service";
import type { SearchProperty } from "@/lib/search/types";

// -- Row type ----------------------------------------------------------------

/**
 * A rich mock-listing row carrying BOTH the search-card fields and the
 * rental-detail fields. `type` is stored as the DB-enum value (e.g. "flat",
 * "semi_detached") — NOT the UI label.
 */
export type MockListingRow = {
  // Core
  id: string;
  slug: string;
  image: string | null;
  price: number;
  address: string;
  city: string;
  postcode: string;
  beds: number;
  baths: number;
  sqft: number;
  type: string; // DB enum value
  listing_type: "sale" | "rent";
  lat: number;
  lng: number;
  epcRating: string | null;
  tenure: string | null;
  lastSoldDate: string | null; // always null for every row
  verified?: boolean;
  // Optional room-captioned gallery
  gallery?: ReadonlyArray<{ url: string; caption: string }>;
  // Rental fields (null for sale rows, populated for rent rows)
  rentFrequency: string | null;
  availableFrom: string | null;
  letAgreed: boolean;
  depositAmount: number | null;
  holdingDepositAmount: number | null;
  furnishing: string | null;
  billsIncluded: boolean | null;
  billsIncludedDetails: string | null;
  petsPolicy: string | null;
  studentsPolicy: string | null;
  minimumTenancyMonths: number | null;
  maximumTenancyMonths: number | null;
  depositScheme: string | null;
  // Optional council tax override
  councilTaxBand?: string | null;
};

// -- Helpers for building rows -----------------------------------------------

const IMG = (n: number) => `/images/properties/property-${n}.jpg`;

/** Null rental fields + letAgreed:false, for SALE rows. */
const SALE_RENTAL_FIELDS = {
  rentFrequency: null,
  availableFrom: null,
  letAgreed: false,
  depositAmount: null,
  holdingDepositAmount: null,
  furnishing: null,
  billsIncluded: null,
  billsIncludedDetails: null,
  petsPolicy: null,
  studentsPolicy: null,
  minimumTenancyMonths: null,
  maximumTenancyMonths: null,
  depositScheme: null,
} as const;

// -- Dataset -----------------------------------------------------------------

export const MOCK_LISTINGS: MockListingRow[] = [
  // ---- Ported existing 12 rows (preserve id + slug exactly) ----------------
  {
    id: "9",
    slug: "modern-2-bed-flat-clifton-bristol-sale",
    image: IMG(1),
    price: 450000,
    address: "Clifton",
    city: "Bristol",
    postcode: "BS8 2AA",
    beds: 2,
    baths: 2,
    sqft: 920,
    type: "flat",
    listing_type: "sale",
    lat: 51.4545,
    lng: -2.6202,
    epcRating: "B",
    tenure: "leasehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "10",
    slug: "4-bed-period-terrace-hackney-london-sale",
    image: IMG(2),
    price: 850000,
    address: "Hackney",
    city: "London",
    postcode: "E8 1DY",
    beds: 4,
    baths: 1,
    sqft: 1480,
    type: "terraced",
    listing_type: "sale",
    lat: 51.545,
    lng: -0.0553,
    epcRating: "C",
    tenure: "freehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "11",
    slug: "cotswold-stone-cottage-burford-oxfordshire-sale",
    image: IMG(3),
    price: 375000,
    address: "Burford",
    city: "Oxfordshire",
    postcode: "OX18 4QA",
    beds: 3,
    baths: 2,
    sqft: 1120,
    type: "cottage",
    listing_type: "sale",
    lat: 51.8071,
    lng: -1.6369,
    epcRating: "D",
    tenure: "freehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "12",
    slug: "5-bed-family-home-hampstead-london-sale",
    image: IMG(4),
    price: 1200000,
    address: "Hampstead",
    city: "London",
    postcode: "NW3 6TR",
    beds: 5,
    baths: 3,
    sqft: 2250,
    type: "detached",
    listing_type: "sale",
    lat: 51.5566,
    lng: -0.178,
    epcRating: "B",
    tenure: "freehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "1",
    slug: "12-kensington-gardens-london-sale",
    image: IMG(1),
    price: 485000,
    address: "12 Kensington Gardens",
    city: "London",
    postcode: "W8 4PT",
    beds: 3,
    baths: 2,
    sqft: 1240,
    type: "terraced",
    listing_type: "sale",
    lat: 51.5014,
    lng: -0.1794,
    epcRating: "C",
    tenure: "freehold",
    lastSoldDate: null,
    gallery: [
      { url: IMG(1), caption: "Front exterior" },
      { url: IMG(2), caption: "Kitchen / diner" },
      { url: IMG(3), caption: "Living room" },
      { url: IMG(4), caption: "Master bedroom" },
      { url: IMG(1), caption: "Family bathroom" },
      { url: IMG(2), caption: "Rear garden" },
    ],
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "2",
    slug: "8-primrose-hill-road-london-sale",
    image: IMG(2),
    price: 625000,
    address: "8 Primrose Hill Road",
    city: "London",
    postcode: "NW1 8YS",
    beds: 4,
    baths: 2,
    sqft: 1650,
    type: "semi_detached",
    listing_type: "sale",
    lat: 51.5392,
    lng: -0.1547,
    epcRating: "B",
    tenure: "leasehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    // Existing RENT row — rental fields reproduce the detail service's derivation.
    id: "3",
    slug: "45-bermondsey-street-london-rent",
    image: IMG(3),
    price: 1850,
    address: "45 Bermondsey Street",
    city: "London",
    postcode: "SE1 3XF",
    beds: 2,
    baths: 1,
    sqft: 820,
    type: "flat",
    listing_type: "rent",
    lat: 51.4998,
    lng: -0.0821,
    epcRating: "D",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-01",
    letAgreed: false,
    depositAmount: 2135, // round(1850 * 5 / (52/12))
    holdingDepositAmount: 427, // round(1850 / (52/12))
    furnishing: "furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "by_arrangement",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    id: "4",
    slug: "3-highbury-park-london-sale",
    image: IMG(1),
    price: 875000,
    address: "3 Highbury Park",
    city: "London",
    postcode: "N5 1QJ",
    beds: 5,
    baths: 3,
    sqft: 2100,
    type: "detached",
    listing_type: "sale",
    lat: 51.5555,
    lng: -0.0984,
    epcRating: "A",
    tenure: "freehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    // Existing RENT row — rental fields reproduce the detail service's derivation.
    id: "5",
    slug: "22-canary-wharf-way-london-rent",
    image: IMG(2),
    price: 2200,
    address: "22 Canary Wharf Way",
    city: "London",
    postcode: "E14 5AB",
    beds: 3,
    baths: 2,
    sqft: 1380,
    type: "flat",
    listing_type: "rent",
    lat: 51.5054,
    lng: -0.0235,
    epcRating: null,
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-01",
    letAgreed: false,
    depositAmount: 2538, // round(2200 * 5 / (52/12))
    holdingDepositAmount: 508, // round(2200 / (52/12))
    furnishing: "unfurnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "by_arrangement",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    id: "6",
    slug: "7-peckham-rye-lane-london-sale",
    image: IMG(3),
    price: 295000,
    address: "7 Peckham Rye Lane",
    city: "London",
    postcode: "SE15 4JU",
    beds: 2,
    baths: 1,
    sqft: 750,
    type: "terraced",
    listing_type: "sale",
    lat: 51.4691,
    lng: -0.0691,
    epcRating: "E",
    tenure: "freehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "7",
    slug: "15-notting-hill-gate-london-commercial",
    image: IMG(1),
    price: 1125000,
    address: "15 Notting Hill Gate",
    city: "London",
    postcode: "W11 3LQ",
    beds: 5,
    baths: 4,
    sqft: 2800,
    type: "detached",
    listing_type: "sale",
    lat: 51.5095,
    lng: -0.1963,
    epcRating: "C",
    tenure: null,
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },
  {
    id: "8",
    slug: "31-borough-market-close-london-sale",
    image: IMG(2),
    price: 410000,
    address: "31 Borough Market Close",
    city: "London",
    postcode: "SE1 9AF",
    beds: 2,
    baths: 1,
    sqft: 900,
    type: "flat",
    listing_type: "sale",
    lat: 51.5055,
    lng: -0.091,
    epcRating: "F",
    tenure: "leasehold",
    lastSoldDate: null,
    ...SALE_RENTAL_FIELDS,
  },

  // ---- New rental rows (id 13+) --------------------------------------------
  {
    // Studio (beds 0), furnished, bills included, pets by arrangement.
    id: "13",
    slug: "studio-flat-old-street-shoreditch-london-rent",
    image: IMG(1),
    price: 1450,
    address: "14 Old Street",
    city: "London",
    postcode: "EC1V 9HL",
    beds: 0,
    baths: 1,
    sqft: 360,
    type: "flat",
    listing_type: "rent",
    lat: 51.5256,
    lng: -0.0876,
    epcRating: "C",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-03-01",
    letAgreed: false,
    depositAmount: 1673, // ~5 weeks
    holdingDepositAmount: 335, // ~1 week
    furnishing: "furnished",
    billsIncluded: true,
    billsIncludedDetails: "Water, gas, electricity & broadband",
    petsPolicy: "by_arrangement",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 6,
    maximumTenancyMonths: 12,
    depositScheme: "DPS",
  },
  {
    // Part-furnished terraced, EPC E (MEES notice fires), students accepted.
    id: "14",
    slug: "2-bed-terrace-fallowfield-manchester-rent",
    image: IMG(2),
    price: 1150,
    address: "27 Wilbraham Road",
    city: "Manchester",
    postcode: "M14 6FS",
    beds: 2,
    baths: 1,
    sqft: 780,
    type: "terraced",
    listing_type: "rent",
    lat: 53.4421,
    lng: -2.2196,
    epcRating: "E",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-15",
    letAgreed: false,
    depositAmount: 1327,
    holdingDepositAmount: 265,
    furnishing: "part_furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "not_allowed",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "MyDeposits",
    gallery: [
      { url: IMG(2), caption: "Front exterior" },
      { url: IMG(3), caption: "Open-plan kitchen" },
      { url: IMG(4), caption: "Living room" },
      { url: IMG(1), caption: "Double bedroom" },
    ],
  },
  {
    // Unfurnished semi, bills included, pets allowed.
    id: "15",
    slug: "3-bed-semi-didsbury-manchester-rent",
    image: IMG(3),
    price: 1500,
    address: "8 Barlow Moor Road",
    city: "Manchester",
    postcode: "M20 6TR",
    beds: 3,
    baths: 2,
    sqft: 1080,
    type: "semi_detached",
    listing_type: "rent",
    lat: 53.4128,
    lng: -2.2335,
    epcRating: "C",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-04-01",
    letAgreed: false,
    depositAmount: 1731,
    holdingDepositAmount: 346,
    furnishing: "unfurnished",
    billsIncluded: true,
    billsIncludedDetails: "Water & council tax included",
    petsPolicy: "allowed",
    studentsPolicy: "not_accepted",
    minimumTenancyMonths: 24,
    maximumTenancyMonths: null,
    depositScheme: "TDS",
  },
  {
    // let_agreed #1. Furnished flat, Bristol.
    id: "16",
    slug: "1-bed-flat-harbourside-bristol-rent",
    image: IMG(4),
    price: 1250,
    address: "6 Canons Road",
    city: "Bristol",
    postcode: "BS1 5UH",
    beds: 1,
    baths: 1,
    sqft: 540,
    type: "flat",
    listing_type: "rent",
    lat: 51.4498,
    lng: -2.5985,
    epcRating: "B",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-01",
    letAgreed: true,
    depositAmount: 1442,
    holdingDepositAmount: 288,
    furnishing: "furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "not_allowed",
    studentsPolicy: "by_arrangement",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    // Detached family let, Bristol. Unfurnished, pets by arrangement.
    id: "17",
    slug: "4-bed-detached-clifton-bristol-rent",
    image: IMG(1),
    price: 1850,
    address: "22 Pembroke Road",
    city: "Bristol",
    postcode: "BS8 3BD",
    beds: 4,
    baths: 2,
    sqft: 1640,
    type: "detached",
    listing_type: "rent",
    lat: 51.4571,
    lng: -2.6184,
    epcRating: "D",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-05-01",
    letAgreed: false,
    depositAmount: 2135,
    holdingDepositAmount: 427,
    furnishing: "unfurnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "not_accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: 36,
    depositScheme: "MyDeposits",
  },
  {
    // Edinburgh New Town flat. Furnished, students accepted, EPC D.
    id: "18",
    slug: "2-bed-flat-new-town-edinburgh-rent",
    image: IMG(2),
    price: 1400,
    address: "11 Dundas Street",
    city: "Edinburgh",
    postcode: "EH3 6QG",
    beds: 2,
    baths: 1,
    sqft: 760,
    type: "flat",
    listing_type: "rent",
    lat: 55.9601,
    lng: -3.1985,
    epcRating: "D",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-03-15",
    letAgreed: false,
    depositAmount: 1615,
    holdingDepositAmount: 323,
    furnishing: "furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 6,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    // let_agreed #2. Edinburgh terraced, part-furnished.
    id: "19",
    slug: "3-bed-terrace-leith-edinburgh-rent",
    image: IMG(3),
    price: 1600,
    address: "45 Constitution Street",
    city: "Edinburgh",
    postcode: "EH6 7DH",
    beds: 3,
    baths: 1,
    sqft: 980,
    type: "terraced",
    listing_type: "rent",
    lat: 55.9742,
    lng: -3.1706,
    epcRating: "C",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-20",
    letAgreed: true,
    depositAmount: 1846,
    holdingDepositAmount: 369,
    furnishing: "part_furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "allowed",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "TDS",
  },
  {
    // Leeds city-centre flat. Bills included, furnished, students accepted.
    id: "20",
    slug: "2-bed-flat-city-centre-leeds-rent",
    image: IMG(4),
    price: 1100,
    address: "3 Wellington Street",
    city: "Leeds",
    postcode: "LS1 4DL",
    beds: 2,
    baths: 2,
    sqft: 720,
    type: "flat",
    listing_type: "rent",
    lat: 53.7965,
    lng: -1.5546,
    epcRating: "B",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-03-01",
    letAgreed: false,
    depositAmount: 1269,
    holdingDepositAmount: 254,
    furnishing: "furnished",
    billsIncluded: true,
    billsIncludedDetails: "Water, gas, electricity & broadband",
    petsPolicy: "not_allowed",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    // Leeds Headingley semi. Unfurnished, pets by arrangement. EPC E (MEES).
    id: "21",
    slug: "3-bed-semi-headingley-leeds-rent",
    image: IMG(1),
    price: 1350,
    address: "18 Otley Road",
    city: "Leeds",
    postcode: "LS6 3AA",
    beds: 3,
    baths: 1,
    sqft: 1010,
    type: "semi_detached",
    listing_type: "rent",
    lat: 53.8197,
    lng: -1.5816,
    epcRating: "E",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-04-10",
    letAgreed: false,
    depositAmount: 1558,
    holdingDepositAmount: 312,
    furnishing: "unfurnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "MyDeposits",
  },
  {
    // Birmingham Jewellery Quarter flat. Part-furnished, pets allowed.
    id: "22",
    slug: "1-bed-flat-jewellery-quarter-birmingham-rent",
    image: IMG(2),
    price: 950,
    address: "7 Vyse Street",
    city: "Birmingham",
    postcode: "B18 6JU",
    beds: 1,
    baths: 1,
    sqft: 520,
    type: "flat",
    listing_type: "rent",
    lat: 52.4889,
    lng: -1.9118,
    epcRating: "C",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-03-05",
    letAgreed: false,
    depositAmount: 1096,
    holdingDepositAmount: 219,
    furnishing: "part_furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "allowed",
    studentsPolicy: "by_arrangement",
    minimumTenancyMonths: 6,
    maximumTenancyMonths: null,
    depositScheme: "TDS",
  },
  {
    // Birmingham Moseley terraced. Unfurnished, students not accepted.
    // DELIBERATE DEPOSIT-CAP BREACH: deposit (£1,800) EXCEEDS 5 weeks' rent
    // (£1,250 pcm => ~£1,442 cap) so the later "deposit cap exceeded" check
    // has a row to flag.
    id: "23",
    slug: "2-bed-terrace-moseley-birmingham-rent",
    image: IMG(3),
    price: 1250,
    address: "31 St Mary's Row",
    city: "Birmingham",
    postcode: "B13 8HW",
    beds: 2,
    baths: 1,
    sqft: 820,
    type: "terraced",
    listing_type: "rent",
    lat: 52.4474,
    lng: -1.8857,
    epcRating: "D",
    tenure: "freehold",
    lastSoldDate: null,
    rentFrequency: "monthly",
    availableFrom: "2026-02-25",
    letAgreed: false,
    depositAmount: 1800, // intentionally > 5 weeks' rent (~£1,442 cap)
    holdingDepositAmount: 288,
    furnishing: "unfurnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "not_allowed",
    studentsPolicy: "not_accepted",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
  },
  {
    // WEEKLY rent path. London Camden flat, price expressed per week.
    id: "24",
    slug: "1-bed-flat-camden-london-weekly-rent",
    image: IMG(4),
    price: 415, // per week
    address: "9 Camden High Street",
    city: "London",
    postcode: "NW1 7JE",
    beds: 1,
    baths: 1,
    sqft: 480,
    type: "flat",
    listing_type: "rent",
    lat: 51.5366,
    lng: -0.1426,
    epcRating: "C",
    tenure: "leasehold",
    lastSoldDate: null,
    rentFrequency: "weekly",
    availableFrom: "2026-03-20",
    letAgreed: false,
    depositAmount: 2075, // ~5 weeks (415 * 5)
    holdingDepositAmount: 415, // ~1 week
    furnishing: "furnished",
    billsIncluded: false,
    billsIncludedDetails: null,
    petsPolicy: "by_arrangement",
    studentsPolicy: "by_arrangement",
    minimumTenancyMonths: 12,
    maximumTenancyMonths: null,
    depositScheme: "DPS",
    gallery: [
      { url: IMG(4), caption: "Living area" },
      { url: IMG(1), caption: "Kitchen" },
      { url: IMG(2), caption: "Bedroom" },
      { url: IMG(3), caption: "Bathroom" },
    ],
  },
];

// -- Enum <-> label maps (exported — Task 4 reuses) --------------------------

export const PROPERTY_TYPE_MAP: Record<string, string> = {
  Detached: "detached",
  "Semi-detached": "semi_detached",
  Terraced: "terraced",
  Flat: "flat",
  Bungalow: "bungalow",
};

export const PROPERTY_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_MAP).map(([k, v]) => [v, k]),
);

// -- Adapters ----------------------------------------------------------------

/** Map every row to a SearchProperty (search-card shape). */
export function getMockSearchProperties(): SearchProperty[] {
  return MOCK_LISTINGS.map((row) => ({
    id: row.id,
    slug: row.slug,
    image: row.image,
    price: row.price,
    address: row.address,
    city: row.city,
    postcode: row.postcode,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    type: PROPERTY_TYPE_REVERSE[row.type] ?? row.type,
    listing_type: row.listing_type,
    lat: row.lat,
    lng: row.lng,
    epc_rating: row.epcRating,
    tenure: row.tenure,
    last_sold_date: row.lastSoldDate,
    verified: row.verified,
    rent_frequency: row.rentFrequency,
    let_agreed: row.letAgreed,
    furnishing: row.furnishing,
    available_from: row.availableFrom,
    bills_included: row.billsIncluded,
    pets_policy: row.petsPolicy,
    students_policy: row.studentsPolicy,
    deposit_amount: row.depositAmount,
  }));
}

/** Find a row by slug, else null. */
export function getMockListingBySlug(slug: string): MockListingRow | null {
  return MOCK_LISTINGS.find((row) => row.slug === slug) ?? null;
}

const EPC_SCORE_MAP: Record<string, number> = {
  A: 95,
  B: 85,
  C: 72,
  D: 58,
  E: 42,
  F: 28,
  G: 12,
};

/**
 * Deterministic view count derived from the row id (stable across renders so
 * SSR/screenshots/tests are reproducible). Maps a char-code sum into 50–550.
 */
function deterministicViewCount(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return 50 + (sum % 501); // 50..550
}

/** Build PropertyDetail media from gallery, else single image, else []. */
function buildMockMedia(row: MockListingRow): PropertyDetail["media"] {
  const source =
    row.gallery ??
    (row.image
      ? [{ url: row.image, caption: `${row.address} exterior` }]
      : []);
  return source.map((item, i) => ({
    id: `mock-media-${row.id}-${i}`,
    mediaType: "image" as const,
    url: item.url,
    thumbnailUrl: item.url,
    caption: item.caption,
    altText: `${item.caption} — ${row.address}, ${row.city}`,
    sortOrder: i,
  }));
}

/** Build a full PropertyDetail from a row (detail-page shape). */
export function toPropertyDetail(row: MockListingRow): PropertyDetail {
  const typeLabel = row.type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const title =
    row.beds === 0
      ? `Studio flat in ${row.city}`
      : `${row.beds} Bed ${typeLabel} in ${row.city}`;

  return {
    listing: {
      id: `mock-listing-${row.id}`,
      slug: row.slug,
      listingType: row.listing_type,
      status: "active",
      price: row.price,
      rentFrequency: row.rentFrequency,
      priceQualifier: null,
      listedDate: "2026-01-15",
      viewCount: deterministicViewCount(row.id),
      serviceChargeAnnual: row.tenure === "leasehold" ? 1800 : null,
      groundRentAnnual: row.tenure === "leasehold" ? 250 : null,
      availableFrom: row.availableFrom,
      depositAmount: row.depositAmount,
      holdingDepositAmount: row.holdingDepositAmount,
      furnishing: row.furnishing,
      minimumTenancyMonths: row.minimumTenancyMonths,
      maximumTenancyMonths: row.maximumTenancyMonths,
      billsIncluded: row.billsIncluded,
      billsIncludedDetails: row.billsIncludedDetails,
      petsPolicy: row.petsPolicy,
      studentsPolicy: row.studentsPolicy,
      depositScheme: row.depositScheme,
    },
    property: {
      id: `mock-property-${row.id}`,
      title,
      description: `A stunning ${row.beds}-bedroom ${row.type.replace(/_/g, " ")} property located at ${row.address}, ${row.city} ${row.postcode}. This property offers ${row.sqft} sq ft of living space with ${row.baths} bathroom${row.baths > 1 ? "s" : ""}. Close to transport links and local amenities.`,
      addressLine1: row.address,
      addressLine2: null,
      city: row.city,
      county: null,
      postcode: row.postcode,
      propertyType: row.type,
      bedrooms: row.beds,
      bathrooms: row.baths,
      receptionRooms: row.beds > 2 ? 2 : 1,
      squareFootage: row.sqft,
      features: {
        items: ["Central heating", "Double glazing", "Garden", "Parking"],
      },
      epcRating: row.epcRating,
      epcScore: row.epcRating ? EPC_SCORE_MAP[row.epcRating] ?? null : null,
      epcPotentialRating: null,
      epcPotentialScore: null,
      tenure: row.tenure,
      leaseRemainingYears: row.tenure === "leasehold" ? 95 : null,
      councilTaxBand:
        row.councilTaxBand ??
        ["A", "B", "C", "D", "E"][Number(row.id) % 5] ??
        "C",
      planningPermissionStatus: null,
      yearBuilt: 2000 + Number(row.id),
      newBuild: false,
      isHmo: false,
      coordinates: { lat: row.lat, lng: row.lng },
    },
    media: buildMockMedia(row),
    agent: {
      id: "mock-agent-1",
      displayName: "Sarah Thompson",
      agencyName: "London Premier Estates",
      contactEmail: "sarah@londonpremier.co.uk",
      contactPhone: "+44 20 7946 0958",
      logoUrl: null,
    },
  };
}
