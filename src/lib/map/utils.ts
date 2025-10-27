import type { Map, StyleSpecification } from 'maplibre-gl'
import { isCustomLayer, isCustomSource } from './ids'

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

export function getBeforeId(
  map: Map | undefined,
  layerId?: string,
  customId?: string,
) {
  const layerIds = map?.getLayersOrder() ?? []

  // Use the customId if provided or the first custom layer id
  return (
    layerIds.find((id) => id === customId) ??
    layerIds.find((id) => isCustomLayer(id) && id !== layerId)
  )
}
