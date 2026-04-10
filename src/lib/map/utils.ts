import type { StyleSpecification } from 'maplibre-gl'

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

export function transformStyle(
  oldStyle: StyleSpecification | undefined,
  newStyle: StyleSpecification,
): StyleSpecification {
  if (!oldStyle) return newStyle

  // Collect all custom layers from the old style, along with the id of the layer that follows them
  const customLayers = oldStyle.layers.flatMap((layer, i) => {
    if (!isCustomLayer(layer.id)) return []

    return {
      layer,
      beforeId: oldStyle.layers[i + 1]?.id,
    }
  })

  const layers = [...newStyle.layers]

  // Insert each custom layer into the new style's layers, preserving their relative order
  customLayers.forEach(({ layer, beforeId }) => {
    const beforeIndex = layers.findIndex((l) => l.id === beforeId)

    if (beforeIndex !== -1) {
      layers.splice(beforeIndex, 0, layer)
    } else {
      layers.push(layer)
    }
  })

  // Merge custom sources from the old style into the new style's sources
  const sources = { ...newStyle.sources }
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
