import { describe, expect, it } from 'vitest'
import { featureFilter } from '@maplibre/maplibre-gl-style-spec'
import type { Location } from '@deltares/fews-pi-requests'
import type { FeatureCollection, Geometry, Polygon } from 'geojson'
import {
  addPropertiesToLocationGeojson,
  getGeojsonPropertiesDiff,
  getLocationVisibilityFilter,
  isLocationVisible,
  type LocationThresholdFilter,
} from '@/lib/map'
import { applyThresholdCrossingsToFeatures } from '@/lib/thresholds/utils'

const polygon: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [4, 52],
      [5, 52],
      [5, 53],
      [4, 52],
    ],
  ],
}

function collection(
  ...properties: Partial<Location>[]
): FeatureCollection<Geometry, Location> {
  return {
    type: 'FeatureCollection',
    features: properties.map((locationProperties, index) => ({
      type: 'Feature',
      geometry: polygon,
      properties: {
        locationId: `location-${index}`,
        ...locationProperties,
      } as Location,
    })),
  }
}

describe('location visibility', () => {
  const locations = collection(
    {},
    { iconName: 'station', thresholdSeverity: 0 },
    { iconName: 'station', thresholdSeverity: 1, thresholdIconName: 'low' },
    { iconName: 'station', thresholdSeverity: 2, thresholdIconName: 'high' },
  )
  const { features } = addPropertiesToLocationGeojson({
    ...locations,
    features: locations.features.map((feature) => ({
      ...feature,
      geometry: { type: 'Point', coordinates: [4, 52] },
    })),
  })
  const categories = features.map((f) => f.properties.locationCategory)

  const cases: [string, string[], LocationThresholdFilter | undefined][] = [
    ['no filters', [], undefined],
    ['one category', [categories[2]], undefined],
    ['several categories', [categories[1], categories[3]], undefined],
    ['unknown category', ['unknown'], undefined],
    ['severity', [], { severities: [1], crossingLocationIds: [] }],
    [
      'missing severity counts as zero',
      [],
      { severities: [0], crossingLocationIds: [] },
    ],
    [
      'crossing with a severity that is not selected',
      [],
      { severities: [1], crossingLocationIds: ['location-3'] },
    ],
    ['nothing selected', [], { severities: [], crossingLocationIds: [] }],
    [
      'category and severity',
      [categories[2]],
      { severities: [2], crossingLocationIds: [] },
    ],
  ]

  it.each(cases)(
    'gives the same result in the layer filter and in code: %s',
    (_name, selectedCategories, thresholdFilter) => {
      const filter = featureFilter(
        getLocationVisibilityFilter(selectedCategories, thresholdFilter),
        'layers[0].filter',
      )
      for (const feature of features) {
        const inLayer = filter.filter({ zoom: 0 }, {
          type: 1,
          properties: feature.properties,
        } as never)
        expect(inLayer).toBe(
          isLocationVisible(
            feature.properties,
            selectedCategories,
            thresholdFilter,
          ),
        )
      }
    },
  )

  it('filters on the expected locations', () => {
    const visibleIds = (
      selectedCategories: string[],
      thresholdFilter?: LocationThresholdFilter,
    ) =>
      features
        .filter((feature) =>
          isLocationVisible(
            feature.properties,
            selectedCategories,
            thresholdFilter,
          ),
        )
        .map((feature) => feature.properties.locationId)

    expect(visibleIds([])).toHaveLength(4)
    expect(visibleIds([categories[2]])).toEqual(['location-2'])
    expect(
      visibleIds([], { severities: [0], crossingLocationIds: ['location-3'] }),
    ).toEqual(['location-0', 'location-1', 'location-3'])
  })

  it('keeps polygons in the same icon group visible across threshold icons', () => {
    const { features } = addPropertiesToLocationGeojson(locations)
    const categories = [features[2].properties.locationCategory]
    const filter = featureFilter(
      getLocationVisibilityFilter(categories, undefined),
      'layers[0].filter',
    )

    expect(
      features
        .filter((feature) =>
          isLocationVisible(feature.properties, categories, undefined),
        )
        .map((feature) => feature.properties.locationId),
    ).toEqual(['location-1', 'location-2', 'location-3'])

    for (const feature of features) {
      expect(
        filter.filter({ zoom: 0 }, {
          type: 3,
          properties: feature.properties,
        } as never),
      ).toBe(isLocationVisible(feature.properties, categories, undefined))
    }
  })
})

describe('applyThresholdCrossingsToFeatures', () => {
  it('overrides the threshold properties and keeps all features and geometry', () => {
    const { features } = collection({ thresholdSeverity: 1 }, {})

    const result = applyThresholdCrossingsToFeatures(features, [
      { locationId: 'location-0', severity: 3, icon: 'crossing' },
    ])

    expect(result).toHaveLength(2)
    expect(result[0].properties).toMatchObject({
      thresholdSeverity: 3,
      thresholdIconName: 'crossing',
    })
    expect(result[0].geometry).toBe(features[0].geometry)
    expect(result[1]).toBe(features[1])
  })
})

describe('getGeojsonPropertiesDiff', () => {
  const previous = collection({ iconName: 'a', thresholdSeverity: 1 }, {})

  function withFeatures(features: typeof previous.features) {
    return { ...previous, features }
  }

  it('returns no updates if nothing changed, even for new objects', () => {
    const next = withFeatures(
      previous.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties },
      })),
    )
    expect(getGeojsonPropertiesDiff(previous, next, 'locationId')).toEqual({
      update: [],
    })
  })

  it('returns only the changed and removed properties', () => {
    const [first, second] = previous.features
    const { thresholdSeverity: _removed, ...properties } = first.properties
    const next = withFeatures([
      { ...first, properties: { ...properties, iconName: 'b' } },
      second,
    ])
    expect(getGeojsonPropertiesDiff(previous, next, 'locationId')).toEqual({
      update: [
        {
          id: 'location-0',
          addOrUpdateProperties: [{ key: 'iconName', value: 'b' }],
          removeProperties: ['thresholdSeverity'],
        },
      ],
    })
  })

  it.each([
    ['there is no previous data', undefined, previous],
    ['the data is a url', previous, 'https://example.com/data.json'],
    [
      'a feature was removed',
      previous,
      withFeatures(previous.features.slice(1)),
    ],
    [
      'the features are in a different order',
      previous,
      withFeatures([...previous.features].reverse()),
    ],
    [
      'a geometry object changed',
      previous,
      withFeatures([
        { ...previous.features[0], geometry: structuredClone(polygon) },
        previous.features[1],
      ]),
    ],
    [
      'an id is duplicated',
      withFeatures([previous.features[0], previous.features[0]]),
      withFeatures([previous.features[0], previous.features[0]]),
    ],
  ])('requires all data if %s', (_name, before, after) => {
    expect(
      getGeojsonPropertiesDiff(before, after, 'locationId'),
    ).toBeUndefined()
  })
})
