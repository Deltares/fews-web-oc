/**
 * Convert a longitude and latitude to a GeoJson point feature.
 *
 * @param latitude of the point.
 * @param longitude of the point.
 * @returns GeoJSON point feature.
 */
export function pointToGeoJson(
  latitude: number,
  longitude: number,
): GeoJSON.Feature<GeoJSON.Geometry> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    properties: {},
  }
}
