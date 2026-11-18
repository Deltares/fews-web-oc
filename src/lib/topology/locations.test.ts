import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Location } from '@deltares/fews-pi-requests'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLocationsAsGeoJson } from './locations'

const { getLocations } = vi.hoisted(() => ({
  getLocations: vi.fn(),
}))

vi.mock('../requests/transformRequest', () => ({
  createTransformRequestFn: () => undefined,
}))

vi.mock('@deltares/fews-pi-requests', () => ({
  DocumentFormat: { GEO_JSON: 'GEO_JSON' },
  PiWebserviceProvider: vi.fn(function () {
    return { getLocations }
  }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function feature(locationId: string): Feature<Geometry, Location> {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { locationId } as Location,
  }
}

function collection(
  ...features: Feature<Geometry, Location>[]
): FeatureCollection<Geometry, Location> {
  return { type: 'FeatureCollection', features }
}

describe('fetchLocationsAsGeoJson', () => {
  it('removes duplicate locations when merging filter results', async () => {
    const firstSharedLocation = feature('shared')
    const uniqueLocation = feature('unique')
    const duplicateSharedLocation = feature('shared')
    getLocations
      .mockResolvedValueOnce(collection(firstSharedLocation, uniqueLocation))
      .mockResolvedValueOnce(collection(duplicateSharedLocation))

    const result = await fetchLocationsAsGeoJson('base-url', [
      'first-filter',
      'second-filter',
    ])

    expect(result.features).toEqual([firstSharedLocation, uniqueLocation])
  })
})
