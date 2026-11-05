import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { ExpressionSpecification } from 'maplibre-gl'
import { mapIds } from './ids'

export interface ExtendedLocation extends Location {
  locationName: string | undefined
  webocIcon: string | undefined
  sortKey: number
  invertedSortKey: number
  isNonPointLocation?: boolean
}

export const locationLayerIds = Object.values(mapIds.location.layer)

export const clickableLocationLayerIds = [
  mapIds.location.layer.circle,
  mapIds.location.layer.symbol,
  mapIds.location.layer.childSymbol,
  mapIds.location.layer.line,
  mapIds.location.layer.fill,
]

export function addPropertiesToLocationGeojson(
  geojson: FeatureCollection<Geometry, Location>,
  showNames: boolean,
  showDataAvailability: boolean,
): FeatureCollection<Geometry, ExtendedLocation> {
  const features = geojson.features.map((feature) => {
    const iconName =
      feature.properties.thresholdIconName ?? feature.properties.iconName

    return {
      ...feature,
      properties: {
        ...feature.properties,
        locationName: showNames ? feature.properties.locationName : '',
        ...(iconName === undefined ? {} : { iconName }),
        webocIcon: getIconName(feature),
        sortKey: getSortKey(feature),
        invertedSortKey: getInvertedSortKey(feature),
        isNonPointLocation: isNonPointGeometry(feature.geometry),
      },
    }
  })

  return {
    ...geojson,
    features,
  }
}

function getIconName({ properties }: Feature<Geometry, Location>) {
  const iconName = properties.thresholdIconName ?? properties.iconName
  if (
    properties.hasDataInViewPeriod === false &&
    properties.hasDataOutsideViewPeriod === true
  ) {
    return `${iconName}-has-outside-data`
  }
  if (
    properties.hasDataInViewPeriod === false &&
    properties.hasDataOutsideViewPeriod === false
  ) {
    return `${iconName}-has-no-data`
  }
  return iconName
}

function getSortKey({ properties }: Feature<Geometry, Location>): number {
  const severityOffset = properties.thresholdSeverity
    ? properties.thresholdSeverity * 10
    : 0
  let offset = 0
  if (properties.hasDataInViewPeriod === true) {
    offset = 2
  } else if (properties.hasDataOutsideViewPeriod === true) {
    offset = 1
  }
  return severityOffset + offset
}

function getInvertedSortKey(feature: Feature<Geometry, Location>): number {
  return Number.MAX_SAFE_INTEGER - getSortKey(feature)
}

export function getLocationWithChilds(
  locationId: string,
  rootToDescendantsMap: Map<string, Location[]>,
): string[] {
  if (!rootToDescendantsMap.has(locationId)) {
    return [locationId]
  }
  const childLocations = rootToDescendantsMap.get(locationId) ?? []
  return [
    locationId,
    ...childLocations.flatMap((loc) =>
      getLocationWithChilds(loc.locationId, rootToDescendantsMap),
    ),
  ]
}

export function shouldBehaveLikeChildFilter(
  isChild: boolean | undefined,
  selectedLocationIds: string[],
): ExpressionSpecification {
  const selected: ExpressionSpecification = [
    'in',
    ['get', 'locationId'],
    ['literal', [...selectedLocationIds]],
  ]
  return isChild
    ? // Child: has parentLocationId AND not selected
      ['all', ['has', 'parentLocationId'], ['!', selected]]
    : // Parent: no parentLocationId OR selected
      ['any', ['!', ['has', 'parentLocationId']], selected]
}

export function isNonPointGeometry(geometry: Geometry | undefined): boolean {
  return (
    geometry?.type === 'Polygon' ||
    geometry?.type === 'MultiPolygon' ||
    geometry?.type === 'LineString' ||
    geometry?.type === 'MultiLineString' ||
    geometry?.type === 'GeometryCollection'
  )
}

export function isPointGeometry(geometry: Geometry | undefined): boolean {
  return geometry?.type === 'Point' || geometry?.type === 'MultiPoint'
}

export interface LocationWithIconLabel extends Location {
  iconLabel?: string
}

export function getLocationCategory(
  feature: Feature<Geometry, LocationWithIconLabel>,
): string {
  const isPoint = isPointGeometry(feature.geometry)
  if (!isPoint) {
    const iconLabel = JSON.stringify(feature.properties.iconLabel ?? null)
    return `__non_point_location_group__:${iconLabel}`
  }
  const activeIcon =
    feature.properties.thresholdIconName ?? feature.properties.iconName
  return `${feature.properties.iconLabel}-${activeIcon}`
}
