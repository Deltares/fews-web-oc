import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { LegacyFilterSpecification } from 'maplibre-gl'

export interface ExtendedLocation extends Location {
  locationName: string | undefined
  iconName: string | undefined
  sortKey: number
  invertedSortKey: number
  selected?: boolean
}

export function addPropertiesToLocationGeojson(
  geojson: FeatureCollection<Geometry, Location>,
  selectedLocationIds: string[],
  showNames: boolean,
): FeatureCollection<Geometry, ExtendedLocation> {
  const features = geojson.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      locationName: showNames ? feature.properties.locationName : '',
      iconName: getIconName(feature),
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
  return properties.thresholdIconName ?? properties.iconName
}

function getSortKey({ properties }: Feature<Geometry, Location>): number {
  return properties.thresholdSeverity ?? 0
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
