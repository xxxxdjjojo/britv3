import type { CityData, NeighbourhoodData } from "@/types/areas";
import { CITIES, CITY_SLUGS } from "./mock-data/cities";
import { getNeighbourhood, getNeighbourhoodsForCity } from "./mock-data/neighbourhoods";

export async function getCityData(citySlug: string): Promise<CityData | null> {
  const normalised = citySlug.toLowerCase();
  // TODO: When Supabase area tables are populated, query here first
  return CITIES[normalised] ?? null;
}

export async function getNeighbourhoodData(citySlug: string, areaSlug: string): Promise<NeighbourhoodData | null> {
  // TODO: Supabase query first
  return getNeighbourhood(citySlug.toLowerCase(), areaSlug.toLowerCase());
}

export async function getNeighbourhoodsForCityData(citySlug: string): Promise<NeighbourhoodData[]> {
  // TODO: Supabase query first
  return getNeighbourhoodsForCity(citySlug.toLowerCase());
}

export function getAllCitySlugs(): string[] {
  return CITY_SLUGS;
}
