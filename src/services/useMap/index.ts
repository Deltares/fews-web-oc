import { mapSymbol } from '@indoorequal/vue-maplibre-gl'
import type { Map } from 'maplibre-gl'
import { inject, ref, type Ref } from 'vue'

const zoomByMap = new WeakMap<Map, Ref<number>>()

function useMapZoom(map: Map): Ref<number> {
  let zoom = zoomByMap.get(map)
  if (!zoom) {
    zoom = ref(map.getZoom())
    zoomByMap.set(map, zoom)
    map.on('zoom', () => {
      zoom!.value = map.getZoom()
    })
  }
  return zoom
}

export function useMap() {
  const map = inject(mapSymbol)?.value
  const zoom = map ? useMapZoom(map) : ref(0)
  return {
    map,
    zoom,
  }
}
