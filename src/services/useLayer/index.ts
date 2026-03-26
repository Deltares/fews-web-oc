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
  GeoJSONSource,
  GeoJSONSourceSpecification,
  ImageSource,
  ImageSourceSpecification,
  Source,
  SourceSpecification,
} from 'maplibre-gl'
import { useLayerOrder } from '@/services/useLayerOrder'

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
      [isLoaded],
      ([loaded]) => {
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
      map.setLayoutProperty(layerId, property, value)
    })
  })

  watch(paint, (newPaint) => {
    if (!map) return
    if (!newPaint) return

    Object.entries(newPaint).forEach(([property, value]) => {
      map.setPaintProperty(layerId, property, value)
    })
  })

  watch(filter, (newFilter) => {
    if (!map) return

    map.setFilter(layerId, newFilter)
  })

  function addLayer(): void {
    if (!map) return

    const _layer = toValue(layer)
    const beforeId = getBeforeId(layerId, map)

    map.addLayer(_layer, beforeId)
  }

  function removeLayer(): void {
    if (!map) return
    if (!map.style) return
    if (!map.getLayer(layerId)) return

    map.removeLayer(layerId)
  }

  onScopeDispose(() => {
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

  function addSource(options: SourceSpecification) {
    if (!map) return

    map.addSource(sourceId, options)
    source.value = map?.getSource(sourceId)
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
    if (isImageSource(options)) {
      const imageSource = source as ImageSource
      imageSource.updateImage(options)
      return
    }

    if (isGeojsonSource(options)) {
      const geojsonSource = source as GeoJSONSource
      geojsonSource.setData(options.data)
      return
    }

    console.warn(
      `Source with id ${sourceId} is not an image source, cannot update source state.`,
    )
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

function isImageSource(
  source: SourceSpecification | undefined,
): source is ImageSourceSpecification {
  return source?.type === 'image'
}

function isGeojsonSource(
  source: SourceSpecification | undefined,
): source is GeoJSONSourceSpecification {
  return source?.type === 'geojson' && 'data' in source
}
