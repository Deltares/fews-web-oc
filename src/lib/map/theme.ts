import { lab } from 'd3'
import type { Map } from 'maplibre-gl'

/**
 * Determines whether a color specification is dark, based on its perceived
 * lightness. For zoom dependent values (legacy stops or expressions) the first
 * color that can be parsed is used.
 *
 * @returns `undefined` if no color could be found in the value.
 */
export function isDarkColor(value: unknown): boolean | undefined {
  if (typeof value === 'string') {
    const color = lab(value)
    if (Number.isNaN(color.l)) return undefined
    return color.l < 50
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const isDark = isDarkColor(item)
      if (isDark !== undefined) return isDark
    }
    return undefined
  }

  if (value !== null && typeof value === 'object' && 'stops' in value) {
    return isDarkColor(value.stops)
  }

  return undefined
}

/**
 * Determines whether the style of a map is dark, based on the color of its
 * first visible background layer.
 *
 * @returns `undefined` if the style has no visible background layer or its
 * color could not be determined, e.g. for raster only styles.
 */
export function isMapStyleDark(map: Map): boolean | undefined {
  for (const layerId of map.getLayersOrder()) {
    if (map.getLayer(layerId)?.type !== 'background') continue
    if (map.getLayoutProperty(layerId, 'visibility') === 'none') continue
    return isDarkColor(map.getPaintProperty(layerId, 'background-color'))
  }
  return undefined
}
