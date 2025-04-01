import { getLayerId, getSourceId } from '@/lib/map/utils'

export const locationIds = {
  layer: {
    circle: getLayerId('location-circle'),
    symbol: getLayerId('location-symbol'),
    text: getLayerId('location-text'),
    fill: getLayerId('location-fill'),
  },
  source: getSourceId('location'),
}

export const locationLayerIds = [
  locationIds.layer.circle,
  locationIds.layer.symbol,
  locationIds.layer.text,
  locationIds.layer.fill,
]

// NOTE: When multiple layers are clicked the order of the layers here is important.
export const clickableLocationLayerIds = [
  locationIds.layer.fill,
  locationIds.layer.circle,
  locationIds.layer.symbol,
]
