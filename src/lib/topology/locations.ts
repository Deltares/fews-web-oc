import {
  DocumentFormat,
  Location,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { FeatureCollection, Geometry } from 'geojson'
import { createTransformRequestFn } from '../requests/transformRequest'

/**
 * Fetch locations for a list of filterIds as GeoJSON.
 *
 * This merges the results for all filterIds into a single GeoJSON object.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterIds List of filterIds for which to fetch locations as GeoJSON.
 * @returns GeoJSON result with locations for all specified filterIds.
 */
export async function fetchLocationsAsGeoJson(
  baseUrl: string,
  filterIds: string[],
): Promise<FeatureCollection<Geometry, Location>> {
  // Fetch GeoJSON for all filterIds.
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const allGeoJson = await Promise.all(
    filterIds.map((filterId) =>
      fetchLocationsAsGeoJsonForSingleFilterId(provider, filterId),
    ),
  )
  // Merge them into a single GeoJSON.
  const geojson = allGeoJson.reduce(
    (prev, cur) => {
      prev.features = prev.features.concat(cur.features)
      return prev
    },
    { type: 'FeatureCollection', features: [] },
  )
  return geojson
}

/**
 * Converts GeoJSON result to FEWS PI locations.
 *
 * The "properties" object for each feature in the GeoJSON is a valid FEWS PI location.
 *
 * @param geojson GeoJSON result with locations.
 * @returns List of FEWS PI locations.
 */
export function convertGeoJsonToFewsPiLocation(
  geojson: FeatureCollection<Geometry, Location>,
): Location[] {
  return geojson.features.map((feature) => feature.properties)
}

/**
 * Fetch locations for a single filterId.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterId FilterId for which to fetch locations as GeoJSON.
 * @returns GeoJSON result with locations for the specified filterId.
 */
async function fetchLocationsAsGeoJsonForSingleFilterId(
  provider: PiWebserviceProvider,
  filterId: string,
): Promise<FeatureCollection<Geometry, Location>> {
  const filter = {
    documentFormat: DocumentFormat.GEO_JSON,
    filterId: filterId,
    showParentLocations: false,
    includeIconNames: true,
    showThresholds: true,
  }
  const response = await provider.getLocations(filter)
  if (!isFeatureCollection(response)) {
    throw new Error('Expected GeoJSON FeatureCollection')
  }
  return response
}

function isFeatureCollection(
  geojson: FeatureCollection<Geometry, Location> | unknown,
): geojson is FeatureCollection<Geometry, Location> {
  return (
    (geojson as FeatureCollection<Geometry, Location>).type ===
    'FeatureCollection'
  )
}

export async function fetchLocationSetAsGeoJson(
  baseUrl: string,
  locationSetId: string,
): Promise<FeatureCollection<Geometry, Location>> {
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const filter = {
    documentFormat: DocumentFormat.GEO_JSON,
    locationSetId: locationSetId,
  }
  const response = await provider.getLocations(filter)
  if (!isFeatureCollection(response)) {
    throw new Error('Expected GeoJSON FeatureCollection')
  }
  return response
}
