import { getLayerId, getSourceId } from '@/lib/map/utils'
import { Location } from '@deltares/fews-pi-requests'
import { Feature, FeatureCollection, Geometry } from 'geojson'

export const locationMapIds = {
  layer: {
    circle: getLayerId('location-circle'),
    symbol: getLayerId('location-symbol'),
    childSymbol: getLayerId('location-child-symbol'),
    text: getLayerId('location-text'),
    fill: getLayerId('location-fill'),
  },
  source: getSourceId('location'),
}

export const locationLayerIds = Object.values(locationMapIds.layer)

// NOTE: When multiple layers are clicked the order of the layers here is important.
export const clickableLocationLayerIds = [
  locationMapIds.layer.fill,
  locationMapIds.layer.circle,
  locationMapIds.layer.symbol,
  locationMapIds.layer.childSymbol,
]

export function addPropertiesToLocationGeojson(
  geojson: FeatureCollection<Geometry, Location>,
  showNames: boolean,
): FeatureCollection<Geometry, Location> {
  const features = geojson.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      locationName: showNames ? feature.properties.locationName : '',
      iconName: getIconName(feature),
      sortKey: getSortKey(feature),
      invertedSortKey: getInvertedSortKey(feature),
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
