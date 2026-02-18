import type { Map } from 'maplibre-gl'

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
}

export function getBeforeId(
  map: Map | undefined,
  layerId?: string,
  customId?: string,
) {
  const layerIds = map?.getLayersOrder() ?? []

  // Use the customId if provided or the first custom layer id
  return (
    layerIds.find((id) => id === customId) ??
    layerIds.find(
      (id) => isCustomLayer(id) && id !== layerId && id !== mapIds.wms.layer,
    )
  )
}
