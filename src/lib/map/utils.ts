import type { Map, StyleSpecification } from 'maplibre-gl'

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

export function transformStyle(
  oldStyle: StyleSpecification | undefined,
  newStyle: StyleSpecification,
): StyleSpecification {
  if (!oldStyle) return newStyle

  const customLayers = oldStyle.layers.filter((layer) =>
    isCustomLayer(layer.id),
  )
  const layers = newStyle.layers.concat(customLayers)

  const sources = newStyle.sources
  for (const [key, value] of Object.entries(oldStyle.sources)) {
    if (isCustomSource(key)) {
      sources[key] = value
    }
  }

  const glyphs = newStyle.glyphs ?? oldStyle.glyphs

  return {
    ...newStyle,
    sources,
    layers,
    glyphs,
  }
}

export function getLayerIds(map: Map) {
  return map.getStyle().layers.map((layer) => layer.id)
}

export function getBeforeId(map: Map) {
  const layerIds = getLayerIds(map)
  if (!layerIds.length) return

  // TODO: By default use id of carto
  //       If carto is not available, use the first custom layer
  //       Should be able to set this in the config
  const beforeId =
    layerIds.find((id) => id === 'boundary_country_outline') ??
    layerIds.find((id) => isCustomLayer(id))
  return beforeId
}
