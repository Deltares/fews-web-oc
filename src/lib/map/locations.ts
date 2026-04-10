import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { LegacyFilterSpecification } from 'maplibre-gl'
import { mapIds } from './ids'

export interface ExtendedLocation extends Location {
  locationName: string | undefined
  webocIcon: string | undefined
  sortKey: number
  invertedSortKey: number
  selected?: boolean
}

export const locationLayerIds = Object.values(mapIds.location.layer)

// NOTE: When multiple layers are clicked the order of the layers here is important.
export const clickableLocationLayerIds = [
  mapIds.location.layer.circle,
  mapIds.location.layer.symbol,
  mapIds.location.layer.childSymbol,
  mapIds.location.layer.fill,
]

export function addPropertiesToLocationGeojson(
  geojson: FeatureCollection<Geometry, Location>,
  selectedLocationIds: string[],
  showNames: boolean,
  showDataAvailability: boolean,
): FeatureCollection<Geometry, ExtendedLocation> {
  const features = geojson.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      locationName: showNames ? feature.properties.locationName : '',
      iconName:
        feature.properties.thresholdIconName ?? feature.properties.iconName,
      webocIcon: getIconName(feature),
      sortKey: getSortKey(feature),
      invertedSortKey: getInvertedSortKey(feature),
      selected: selectedLocationIds.includes(feature.properties.locationId),
    },
  }))

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
  const offset =
    properties.hasDataInViewPeriod === true
      ? 2
      : properties.hasDataOutsideViewPeriod === true
        ? 1
        : 0
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
): LegacyFilterSpecification {
  return isChild
    ? // Child: has parentLocationId AND not selected
      ['all', ['has', 'parentLocationId'], ['!=', 'selected', true]]
    : // Parent: no parentLocationId OR selected
      ['any', ['!has', 'parentLocationId'], ['==', 'selected', true]]
}
