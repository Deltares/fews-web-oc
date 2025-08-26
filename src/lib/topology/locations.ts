import {
  DocumentFormat,
  Location,
  LocationsFilter,
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
  filterOptions?: Partial<LocationsFilter>,
): Promise<FeatureCollection<Geometry, Location>> {
  // Fetch GeoJSON for all filterIds.
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const settledResponses = await Promise.allSettled(
    filterIds.map((filterId) =>
      fetchLocationsAsGeoJsonForSingleFilterId(
        provider,
        filterId,
        filterOptions,
      ),
    ),
  )
  const error = (
    settledResponses.find((res) => res.status === 'rejected') as
      | PromiseRejectedResult
      | undefined
  )?.reason

  if (error) {
    console.error('Error fetching locations:', error)
  }

  // Merge them into a single GeoJSON.
  const response = settledResponses
    .filter((res) => res.status === 'fulfilled')
    .map((res) => res.value)
  const geojson = response.reduce(
    (acc: FeatureCollection<Geometry, Location>, item) => {
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
  filterOptions?: Partial<LocationsFilter>,
): Promise<FeatureCollection<Geometry, Location>> {
  const filter: LocationsFilter = {
    documentFormat: DocumentFormat.GEO_JSON,
    filterId: filterId,
    showParentLocations: true,
    includeIconNames: true,
    showThresholds: true,
    ...filterOptions,
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

const locationSetCache = new Map<
  string,
  FeatureCollection<Geometry, Location>
>()

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
  if (locationSetCache.has(locationSetId)) {
    return locationSetCache.get(locationSetId)!
  }
  const response = await provider.getLocations(filter)
  if (!isFeatureCollection(response)) {
    throw new Error('Expected GeoJSON FeatureCollection')
  }
  locationSetCache.set(locationSetId, response)
  return response
}

/**
 * Fetch locations based on a LocationsFilter.
 *
 * @param baseUrl - The base URL of the FEWS PI Webservice.
 * @param locationsFilter - The filter to apply when fetching locations.
 * @return A promise that resolves to an array of Location objects.
 * @throws Error if the fetch operation fails.
 */
export async function fetchLocations(
  baseUrl: string,
  locationsFilter: LocationsFilter,
): Promise<Location[]> {
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  try {
    const response = await provider.getLocations({
      ...locationsFilter,
      documentFormat: DocumentFormat.PI_JSON,
    })
    return response.locations
  } catch (error) {
    console.error('Error fetching locations:', error)
  }
  return []
}

export function createLocationToChildrenMap(locations: Location[]) {
  const nodeToChildrenMap = new Map<string, Location[]>()

  locations.forEach((loc) => {
    if (loc.parentLocationId === undefined) return

    if (!nodeToChildrenMap.has(loc.parentLocationId)) {
      nodeToChildrenMap.set(loc.parentLocationId, [])
    }
    nodeToChildrenMap.get(loc.parentLocationId)?.push(loc)
  })

  return nodeToChildrenMap
}
