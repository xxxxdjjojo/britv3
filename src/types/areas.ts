// src/types/areas.ts

export type PropertyTypeCode = "D" | "S" | "T" | "F" | "O";

export type CityData = Readonly<{
  slug: string;
  name: string;
  county: string;
  region: string;
  population: string;
  description: string;
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: number;
  yoyChangeFormatted: string;
  activeListings: number;
  avgDaysToSell: number;
  medianPrice: number;
  transactionsLast12m: number;
  priceByType: Record<PropertyTypeCode, number>;
  boroughs: BoroughSummary[];
  transport: TransportLink[];
  coordinates: { lat: number; lng: number };
  postcodePrefix: string;
}>;

export type BoroughSummary = Readonly<{
  name: string;
  slug: string;
  avgPrice: string;
  description: string;
}>;

export type TransportLink = Readonly<{
  name: string;
  type: "rail" | "underground" | "tram" | "bus" | "airport";
  detail: string;
  emoji: string;
}>;

export type NeighbourhoodData = Readonly<{
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  borough: string;
  postcode: string;
  description: string;
  coordinates: { lat: number; lng: number };
  avgPrice: number;
  avgPriceFormatted: string;
  yoyChange: string;
  greenSpace: string;
  walkability: "High" | "Medium" | "Low";
  noiseLevel: "Quiet" | "Moderate" | "Busy";
  demographics: {
    topGroup: string;
    medianAge: number;
    ownerOccupied: number;
    privateRented: number;
    socialRented: number;
    vibe: string;
  };
  schools: SchoolEntry[];
  localFavourites: LocalFavourite[];
  propertyMix: Record<PropertyTypeCode, number>;
  broadband: { download: number; upload: number; coverage5g: boolean };
  crimeIndex: { local: number; borough: number; city: number };
  agent: { name: string; role: string; quote: string; initials: string };
  transportLinks: TransportLink[];
}>;

export type SchoolEntry = Readonly<{
  name: string;
  ofsted: "Outstanding" | "Good" | "Requires Improvement" | "Inadequate";
  distance: string;
  type: "Primary" | "Secondary" | "All-through";
}>;

export type LocalFavourite = Readonly<{
  label: string;
  desc: string;
  category: "park" | "cafe" | "pub" | "school" | "shop" | "attraction";
}>;

export type SoldPriceRecord = Readonly<{
  id: string;
  slug: string;
  address: string;
  postcode: string;
  propertyType: PropertyTypeCode;
  propertyTypeLabel: string;
  beds: number;
  price: number;
  priceFormatted: string;
  date: string;
  dateFormatted: string;
  oldNew: "Y" | "N";
  tenure: "F" | "L";
  tenureLabel: string;
  vsAsking: number | null;
  areaSlug: string;
}>;

export type SoldPriceDetail = Readonly<{
  address: string;
  postcode: string;
  propertyType: string;
  lastPrice: number;
  lastDate: string;
  growth: string;
  estimatedValue: string;
  coordinates: { lat: number; lng: number };
  history: Array<{ price: number; date: string; change: string | null }>;
  nearby: Array<{ address: string; price: string; date: string; slug: string }>;
  areaSlug: string;
  areaName: string;
  areaGrowth: string;
}>;
