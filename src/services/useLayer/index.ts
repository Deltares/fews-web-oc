import {
  computed,
  inject,
  MaybeRefOrGetter,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'
import { useMap } from '@/services/useMap'
import {
  AddLayerObject,
  AllLayoutProperties,
  AllPaintProperties,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  ImageSource,
  ImageSourceSpecification,
  Source,
  SourceSpecification,
} from 'maplibre-gl'
import { useLayerOrder } from '@/services/useLayerOrder'
import { getGeojsonPropertiesDiff, isStyleReady } from '@/lib/map'

export function useLayer(
  layerId: string,
  layer: MaybeRefOrGetter<AddLayerObject>,
  source?: MaybeRefOrGetter<Source | undefined>,
) {
  const isLoaded = inject(isLoadedSymbol)!

  const { map } = useMap()
  const { getBeforeId } = useLayerOrder()

  if (source) {
    watch(
      [isLoaded, () => toValue(source)],
      ([loaded, src]) => {
        if (loaded && src) {
          addLayer()
        }
      },
      { immediate: true },
    )
  } else {
    watch(
      isLoaded,
      (loaded) => {
        if (loaded) {
          addLayer()
        }
      },
      { immediate: true },
    )
  }

  const layout = computed(() => {
    const _layer = toValue(layer)
    return 'layout' in _layer ? _layer.layout : undefined
  })

  const paint = computed(() => {
    const _layer = toValue(layer)
    return 'paint' in _layer ? _layer.paint : undefined
  })

  const filter = computed(() => {
    const _layer = toValue(layer)
    return 'filter' in _layer ? _layer.filter : undefined
  })

  watch(layout, (newLayout) => {
    if (!map) return
    if (!newLayout) return

    Object.entries(newLayout).forEach(([property, value]) => {
      map.setLayoutProperty(
        layerId,
        property as keyof AllLayoutProperties,
        value,
      )
    })
  })

  watch(paint, (newPaint) => {
    if (!map) return
    if (!newPaint) return

    Object.entries(newPaint).forEach(([property, value]) => {
      map.setPaintProperty(layerId, property as keyof AllPaintProperties, value)
    })
  })

  function applyFilter(): void {
    if (!map || !isStyleReady(map)) return
    if (!map.getLayer(layerId)) return

    map.setFilter(layerId, filter.value)
  }

  watch(filter, applyFilter)
  // A rebuilt style copies its layers from the previous style, so a filter
  // change that was skipped during the rebuild has to be applied afterwards.
  map?.on('style.load', applyFilter)

  function addLayer(): void {
    if (!map) return

    const _layer = toValue(layer)
    const beforeId = getBeforeId(layerId, map.getLayersOrder())

    map.addLayer(_layer, beforeId)
  }

  function removeLayer(): void {
    if (!map) return
    if (!map.style) return
    if (!map.getLayer(layerId)) return

    map.removeLayer(layerId)
  }

  onScopeDispose(() => {
    map?.off('style.load', applyFilter)
    removeLayer()
  })
}

export function useSource(
  sourceId: string,
  sourceOptions: MaybeRefOrGetter<SourceSpecification | undefined>,
) {
  const isLoaded = inject(isLoadedSymbol)!
  const source = shallowRef<Source>()

  const { map } = useMap()
  let currentGeojsonData: GeoJSONSourceSpecification['data'] | undefined

  function addSource(options: SourceSpecification) {
    if (!map) return

    map.addSource(sourceId, options)
    source.value = map?.getSource(sourceId)
    if (isGeojsonSourceSpecification(options)) {
      currentGeojsonData = options.data
    }
  }

  watch(
    [isLoaded, () => toValue(sourceOptions)],
    ([loaded, options]) => {
      if (!loaded) return
      if (!options) return

      const source = map?.getSource(sourceId)
      if (source) {
        updateSource(source, options)
      } else {
        addSource(options)
      }
    },
    { immediate: true },
  )

  function updateSource(source: Source, options: SourceSpecification) {
    if (isImageSourceSpecification(options)) {
      const imageSource = source as ImageSource
      imageSource.updateImage(options)
      return
    }

    if (isGeojsonSourceSpecification(options)) {
      updateGeojsonSource(source as GeoJSONSource, options)
      return
    }

    console.warn(
      `Source with id ${sourceId} is not an image source, cannot update source state.`,
    )
  }

  // Sending GeoJSON to the worker is expensive for large geometries, so only
  // changed properties are sent if the geometry stays the same.
  function updateGeojsonSource(
    source: GeoJSONSource,
    options: GeoJSONSourceSpecification,
  ) {
    const diff =
      typeof options.promoteId === 'string'
        ? getGeojsonPropertiesDiff(
            currentGeojsonData,
            options.data,
            options.promoteId,
          )
        : undefined
    if (!diff) {
      void source.setData(options.data)
    } else if (diff.update?.length) {
      void source.updateData(diff)
    }
    currentGeojsonData = options.data
  }

  function removeSource() {
    if (!map) return
    if (!isLoaded.value) return
    if (!map.getSource(sourceId)) return

    // Remove all layers that use this source before removing the source itself
    const layers = map.getStyle().layers ?? []
    layers.forEach((layer) => {
      if ('source' in layer && layer.source === sourceId) {
        map.removeLayer(layer.id)
      }
    })

    map.removeSource(sourceId)
  }

  onScopeDispose(() => {
    removeSource()
  })

  return {
    source,
  }
}

function isImageSourceSpecification(
  source: SourceSpecification | undefined,
): source is ImageSourceSpecification & { url: string } {
  return source?.type === 'image' && typeof source.url === 'string'
}

function isGeojsonSourceSpecification(
  source: SourceSpecification | undefined,
): source is GeoJSONSourceSpecification {
  return source?.type === 'geojson' && 'data' in source
}
