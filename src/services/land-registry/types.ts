/**
 * Types matching the Land Registry Price Paid Data CSV format.
 * See: https://www.gov.uk/guidance/about-the-price-paid-data
 */

export type PricePaidRecord = Readonly<{
  transaction_id: string;
  price: number;
  date_of_transfer: string;
  postcode: string;
  property_type: "D" | "S" | "T" | "F" | "O"; // Detached, Semi, Terraced, Flat, Other
  old_new: "Y" | "N"; // Newly built or established
  duration: "F" | "L"; // Freehold or Leasehold
  paon: string; // Primary Addressable Object Name (house number/name)
  saon: string; // Secondary Addressable Object Name (flat number)
  street: string;
  locality: string;
  town: string;
  district: string;
  county: string;
  ppd_category: "A" | "B"; // Standard (A) or Additional (B)
  record_status: "A" | "C" | "D"; // Addition, Change, Delete
}>;

export type AreaPriceTrend = Readonly<{
  year: number;
  averagePrice: number;
  transactionCount: number;
}>;

export type PricePaidSummary = Readonly<{
  recentSales: PricePaidRecord[];
  areaTrend: AreaPriceTrend[];
  averagePrice: number;
}>;
