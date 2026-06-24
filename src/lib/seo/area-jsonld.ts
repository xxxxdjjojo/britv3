import type { CityData, NeighbourhoodData } from "@/types/areas";
import { appBaseUrl } from "@/config/brand";

const BASE_URL = appBaseUrl();

export function cityPlaceJsonLd(city: CityData) {
  return {
    "@context": "https://schema.org", "@type": "City", name: city.name,
    containedInPlace: { "@type": "AdministrativeArea", name: city.county },
    geo: { "@type": "GeoCoordinates", latitude: city.coordinates.lat, longitude: city.coordinates.lng },
    url: `${BASE_URL}/areas/${city.slug}`, description: city.description,
  };
}

export function neighbourhoodPlaceJsonLd(n: NeighbourhoodData) {
  return {
    "@context": "https://schema.org", "@type": "Place", name: n.name,
    containedInPlace: { "@type": "City", name: n.cityName },
    geo: { "@type": "GeoCoordinates", latitude: n.coordinates.lat, longitude: n.coordinates.lng },
    url: `${BASE_URL}/areas/${n.citySlug}/${n.slug}`, description: n.description,
  };
}
