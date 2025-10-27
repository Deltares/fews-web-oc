const LAYER_PREFIX = 'weboc-layer-'
const SOURCE_PREFIX = 'weboc-source-'

export function getLayerId(id: string) {
  return `${LAYER_PREFIX}${id}`
}

export function getSourceId(id: string) {
  return `${SOURCE_PREFIX}${id}`
}

export function isCustomLayer(id: string) {
  return id.startsWith(LAYER_PREFIX)
}

export function isCustomSource(id: string) {
  return id.startsWith(SOURCE_PREFIX)
}

export const mapIds = {
  wms: {
    layer: getLayerId('wms'),
    source: getSourceId('wms'),
  },
  location: {
    layer: {
      circle: getLayerId('location-circle'),
      symbol: getLayerId('location-symbol'),
      childSymbol: getLayerId('location-child-symbol'),
      text: getLayerId('location-text'),
      fill: getLayerId('location-fill'),
    },
    source: getSourceId('location'),
  },
  selectedCoordinate: {
    layer: getLayerId('selected-coordinate'),
    source: getSourceId('selected-coordinate'),
  },
} as const

export const locationLayerIds = Object.values(mapIds.location.layer)

export const topLevelLayerIds = [
  ...locationLayerIds,
  mapIds.selectedCoordinate.layer,
]

// NOTE: When multiple layers are clicked the order of the layers here is important.
export const clickableLocationLayerIds = [
  mapIds.location.layer.fill,
  mapIds.location.layer.circle,
  mapIds.location.layer.symbol,
  mapIds.location.layer.childSymbol,
]
