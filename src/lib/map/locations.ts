import { getLayerId, getSourceId } from '@/lib/map/utils'
import { Location } from '@deltares/fews-pi-requests'
import { Feature, FeatureCollection, Geometry } from 'geojson'

export const locationIds = {
  layer: {
    circle: getLayerId('location-circle'),
    symbol: getLayerId('location-symbol'),
    childSymbol: getLayerId('location-child-symbol'),
    text: getLayerId('location-text'),
    fill: getLayerId('location-fill'),
  },
  source: getSourceId('location'),
}

export const locationLayerIds = [
  locationIds.layer.circle,
  locationIds.layer.symbol,
  locationIds.layer.childSymbol,
  locationIds.layer.text,
  locationIds.layer.fill,
]

// NOTE: When multiple layers are clicked the order of the layers here is important.
export const clickableLocationLayerIds = [
  locationIds.layer.fill,
  locationIds.layer.circle,
  locationIds.layer.symbol,
  locationIds.layer.childSymbol,
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

function getSortArray({ properties }: Feature<Geometry, Location>) {
  return [properties.thresholdIconName]
}

function getSortKey(feature: Feature<Geometry, Location>): number {
  return getSortArray(feature).filter(Boolean).length
}

function getInvertedSortKey(feature: Feature<Geometry, Location>): number {
  return getSortArray(feature).filter((v) => !v).length
}
