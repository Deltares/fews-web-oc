import type {
  Location,
  LocationsLayerZoomSettings,
} from '@deltares/fews-pi-requests'
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
  zoom: number,
  minZoom: LocationsLayerZoomSettings,
  maxZoom: LocationsLayerZoomSettings,
): FeatureCollection<Geometry, ExtendedLocation> {
  const features = geojson.features
    .filter((feature) =>
      isLocationVisibleAtZoom(feature.properties, zoom, minZoom, maxZoom),
    )
    .map((feature) => ({
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

function getEffectiveZoomLevel(
  location: Location,
  zoomSetting: LocationsLayerZoomSettings,
): number {
  const attributeId = zoomSetting.levelLocationAttribute
  if (attributeId) {
    const attribute = location.attributes?.find((a) => a.id === attributeId)
    const level = Number(attribute?.value)
    if (attribute?.value !== undefined && !Number.isNaN(level)) {
      return level
    }
  }
  return zoomSetting.level
}

export function isLocationVisibleAtZoom(
  location: Location,
  zoom: number,
  minZoom: LocationsLayerZoomSettings,
  maxZoom: LocationsLayerZoomSettings,
): boolean {
  const effectiveMinZoom = getEffectiveZoomLevel(location, minZoom)
  const effectiveMaxZoom = getEffectiveZoomLevel(location, maxZoom)
  return zoom >= effectiveMinZoom && zoom <= effectiveMaxZoom
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
