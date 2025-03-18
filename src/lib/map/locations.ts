import { getLayerId, getSourceId } from '@/lib/map/utils'

export const locationsCircleLayerId = getLayerId('location-circle')
export const locationsSymbolLayerId = getLayerId('location-symbol')
export const locationsTextLayerId = getLayerId('location-text')
export const locationsFillLayerId = getLayerId('location-fill')
export const locationsSourceId = getSourceId('location')

export const locationLayerIds = [
  locationsCircleLayerId,
  locationsSymbolLayerId,
  locationsTextLayerId,
  locationsFillLayerId,
]
