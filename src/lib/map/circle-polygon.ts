export function circlePolygon(
  lng: number,
  lat: number,
  radiusMetres: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const coords: [number, number][] = Array.from({ length: points + 1 }, (_, i) => {
    const angle = (2 * Math.PI * i) / points;
    const dLat = (radiusMetres * Math.cos(angle)) / earthRadius;
    const dLng = (radiusMetres * Math.sin(angle)) / (earthRadius * Math.cos(latRad));
    return [lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI];
  });
  // Close the ring
  coords[coords.length - 1] = coords[0];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}
