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
    const settledResponses = await Promise.allSettled(
      filterIds.map((filterId) =>
        fetchLocationsAsGeoJsonForSingleFilterId(provider, filterId),
      ),
    )
    const error = (settledResponses.find(
      (res) => res.status === "rejected"
    ) as PromiseRejectedResult | undefined)?.reason;

    if (error) {
      console.error('Error fetching locations:', error)
    }

    // Merge them into a single GeoJSON.
    const response = (settledResponses.filter(
      (res) => res.status === "fulfilled"
    )).map((res) => res.value)
    const geojson = response.reduce(
      (acc: FeatureCollection<Geometry, Location>, item ) => {
        acc.features = acc.features.concat(item.features)
        return acc
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
  // TODO: Remove cast to any when fews-pi-requests supports GeoJSON response in LocationResponse
  //       type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = (await provider.getLocations(filter)) as any
  return response as FeatureCollection<Geometry, Location>
}
