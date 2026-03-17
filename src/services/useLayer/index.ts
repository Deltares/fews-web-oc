import {
  inject,
  MaybeRefOrGetter,
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from 'vue'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'
import { useMap } from '@/services/useMap'
import {
  AddLayerObject,
  ImageSource,
  ImageSourceSpecification,
  Source,
  SourceSpecification,
} from 'maplibre-gl'

export function useLayer(
  layerId: string,
  layer: MaybeRefOrGetter<AddLayerObject>,
  source?: MaybeRefOrGetter<Source | undefined>,
) {
  const isLoaded = inject(isLoadedSymbol)!

  const { map } = useMap()

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

  function addLayer(): void {
    if (!map) return

    const _layer = toValue(layer)
    map.addLayer(_layer)
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

      if (source.value) {
        updateSource(options)
      } else {
        addSource(options)
      }
    },
    { immediate: true },
  )

  function updateSource(options: SourceSpecification) {
    if (isImageSource(options)) {
      const imageSource = source.value as ImageSource
      imageSource.updateImage(options)
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

  function addEvents() {
    if (!map) return

    map.on('style.load', addSource)
  }

  function removeEvents() {
    if (!map) return

    map.off('style.load', addSource)
  }

  onMounted(() => {
    addEvents()
  })

  onScopeDispose(() => {
    removeSource()
    removeEvents()
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
