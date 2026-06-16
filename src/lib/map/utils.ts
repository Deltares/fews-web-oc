import type { StyleSpecification } from 'maplibre-gl'

const LAYER_PREFIX = 'weboc-layer-'
const SOURCE_PREFIX = 'weboc-source-'
const TERRADRAW_PREFIX = 'td-measure-'

export function getLayerId(id: string) {
  return `${LAYER_PREFIX}${id}`
}

export function getSourceId(id: string) {
  return `${SOURCE_PREFIX}${id}`
}

export function isCustomLayer(id: string) {
  return id.startsWith(LAYER_PREFIX) || id.startsWith(TERRADRAW_PREFIX)
}

export function isCustomSource(id: string) {
  return id.startsWith(SOURCE_PREFIX) || id.startsWith(TERRADRAW_PREFIX)
}

export function transformStyle(
  oldStyle: StyleSpecification | undefined,
  newStyle: StyleSpecification,
  getBeforeId: (layerId: string, currentOrder: string[]) => string | undefined,
): StyleSpecification {
  if (!oldStyle) return newStyle

  const layers = [...newStyle.layers]
  // Insert custom layers from the old style into the new style's layers array,
  // using the desired layer order on the new style's layers to determine the correct position
  // for each custom layer
  for (const layer of oldStyle.layers) {
    if (isCustomLayer(layer.id)) {
      const beforeId = getBeforeId(
        layer.id,
        layers.map((l) => l.id),
      )
      const beforeIndex = layers.findIndex((l) => l.id === beforeId)

      if (beforeIndex !== -1) {
        // Insert the custom layer before the found index
        layers.splice(beforeIndex, 0, layer)
      } else {
        // If no suitable position is found, append the custom layer at the end
        layers.push(layer)
      }
    }
  }

  const sources = { ...newStyle.sources }
  // Add custom sources from the old style to the new style's sources
  for (const [key, value] of Object.entries(oldStyle.sources)) {
    if (isCustomSource(key)) {
      sources[key] = value
    }
  }

  // Prefer newStyle.glyphs, fallback to oldStyle.glyphs if not present
  const glyphs = newStyle.glyphs ?? oldStyle.glyphs

  return {
    ...newStyle,
    sources,
    layers,
    glyphs,
  }
}
