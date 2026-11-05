import { AnimatedRasterLayerOptions } from '@/components/wms/AnimatedRasterLayer.vue'
import { GetMapFilter } from '@deltares/fews-wms-requests'
import type { FeatureCollection } from 'geojson'
import type {
  GeoJSONFeatureDiff,
  GeoJSONSourceDiff,
  GeoJSONSourceSpecification,
  Map,
  StyleSpecification,
} from 'maplibre-gl'

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

/**
 * Whether style mutations such as setFilter and setFeatureState are allowed.
 * They throw while a style is being rebuilt, and map.style is null after a lost
 * WebGL context. map.isStyleLoaded() is too strict to use here: it is also false
 * while tiles are loading, which would drop updates that are valid.
 */
export function isStyleReady(map: Map): boolean {
  return map.style?._loaded === true
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

export function getFilterFromLayerOptions(options: AnimatedRasterLayerOptions) {
  const filter: Omit<GetMapFilter, 'time' | 'bbox'> = {
    service: 'WMS',
    version: '1.3',
    crs: 'EPSG:3857',
    layers: options.name,
    aggregation: options.aggregationLabel,
    useLastValue: options.useLastValue,
    styles: options.style,
    elevation: options.elevation ?? undefined,
    layerType: options.layerType,
    taskRunId: options.taskRunId,
    useDisplayUnits: options.useDisplayUnits,
  }

  if (options.colorScaleRange) {
    filter.colorscalerange = options.colorScaleRange
  }

  if (options.ensembleSelection) {
    filter.ensembleId = options.ensembleSelection.ensembleId
    filter.ensembleMemberId = options.ensembleSelection.ensembleMemberId
  }

  return filter
}

/**
 * Returns the property changes between two versions of a feature collection.
 * Returns undefined if the changes are not limited to properties, which means
 * that the features or their geometry objects differ. Geometry is compared by
 * reference, because comparing large geometries by value is too expensive.
 */
export function getGeojsonPropertiesDiff(
  previous: GeoJSONSourceSpecification['data'] | undefined,
  next: GeoJSONSourceSpecification['data'],
  promoteId: string,
): GeoJSONSourceDiff | undefined {
  if (!isFeatureCollection(previous) || !isFeatureCollection(next)) return
  if (previous.features.length !== next.features.length) return

  const ids = new Set<string | number>()
  const update: GeoJSONFeatureDiff[] = []
  for (const [index, feature] of next.features.entries()) {
    const previousFeature = previous.features[index]
    const id = feature.properties?.[promoteId]
    if (
      id === undefined ||
      ids.has(id) ||
      previousFeature.properties?.[promoteId] !== id ||
      previousFeature.geometry !== feature.geometry
    ) {
      return
    }
    ids.add(id)

    const properties = feature.properties ?? {}
    const previousProperties = previousFeature.properties ?? {}
    const addOrUpdateProperties = Object.entries(properties)
      .filter(([key, value]) => previousProperties[key] !== value)
      .map(([key, value]) => ({ key, value }))
    const removeProperties = Object.keys(previousProperties).filter(
      (key) => !(key in properties),
    )
    if (addOrUpdateProperties.length || removeProperties.length) {
      update.push({ id, addOrUpdateProperties, removeProperties })
    }
  }
  return { update }
}

function isFeatureCollection(
  data: GeoJSONSourceSpecification['data'] | undefined,
): data is FeatureCollection {
  return typeof data === 'object' && data.type === 'FeatureCollection'
}
