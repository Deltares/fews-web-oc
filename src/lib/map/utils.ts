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

  const customLayers = oldStyle.layers.flatMap((layer, i) => {
    if (!isCustomLayer(layer.id)) return []

    return {
      layer,
      beforeId: oldStyle.layers[i + 1]?.id,
    }
  })

  const layers = [...newStyle.layers]

  customLayers.forEach(({ layer, beforeId }) => {
    const beforeIndex = layers.findIndex((l) => l.id === beforeId)

    if (beforeIndex !== -1) {
      layers.splice(beforeIndex, 0, layer)
    } else {
      layers.push(layer)
    }
  })

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

export function getBeforeId(
  layerId: string,
  desiredOrder: string[],
  currentOrder: string[],
): string | undefined {
  // Find the index of the target layer in the desired order
  const desiredIdx = desiredOrder.indexOf(layerId)

  if (desiredIdx !== -1) {
    // Look for the next layer (after layerId) in layerOrder that exists in currentOrder
    const nextInOrder = desiredOrder
      .slice(desiredIdx + 1)
      .find((id) => currentOrder.includes(id))
    if (nextInOrder) return nextInOrder
  }

  // If not found, return the first custom layer in currentOrder that is not layerId and not in layerOrder
  return currentOrder.find(
    (id) => isCustomLayer(id) && id !== layerId && !desiredOrder.includes(id),
  )
}
