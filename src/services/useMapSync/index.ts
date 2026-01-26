import {
  ref,
  onUnmounted,
  onMounted,
  inject,
  provide,
  type Ref,
  type InjectionKey,
} from 'vue'
import type { Map as MaplibreMap } from 'maplibre-gl'

type MoveHandler = Parameters<MaplibreMap['on']>[1]

interface MapSync {
  synchronizedMaps: Ref<MaplibreMap[]>
  moveHandlers: Ref<MoveHandler[]>
}

const MAP_SYNC_KEY = Symbol('mapSync') as InjectionKey<MapSync>

export function provideMapSync() {
  provide(MAP_SYNC_KEY, {
    synchronizedMaps: ref([]),
    moveHandlers: ref([]),
  })
}

/**
 * Synchronize movements of multiple maps.
 *
 * This ensures that interactions resulting in map movements
 * are mirrored across all synchronized maps without causing
 * infinite loops or interrupting prolonged movements.
 */
export function useMapSync(mapInstance: MaplibreMap | undefined) {
  const mapSync = inject(MAP_SYNC_KEY)

  if (!mapSync) {
    // Do nothing if mapSync is not provided
    return
  }

  const { synchronizedMaps, moveHandlers } = mapSync

  const addMapToSync = (map: MaplibreMap) => {
    const mapIndex = synchronizedMaps.value.length
    // @ts-ignore: Type instantiation is excessively deep and possibly infinite.
    synchronizedMaps.value.push(map)

    const handleMapMove = () => {
      disableSync()

      const center = map.getCenter()
      const zoom = map.getZoom()
      const bearing = map.getBearing()
      const pitch = map.getPitch()

      // @ts-ignore: Type instantiation is excessively deep and possibly infinite.
      const otherMaps = synchronizedMaps.value.filter(
        (_, index) => index !== mapIndex,
      )
      otherMaps.forEach((otherMap) => {
        otherMap.jumpTo({
          center,
          zoom,
          bearing,
          pitch,
        })
      })

      enableSync()
    }

    moveHandlers.value[mapIndex] = handleMapMove
    map.on('move', handleMapMove)
  }

  const enableSync = () => {
    synchronizedMaps.value.forEach((map, index) => {
      map.on('move', moveHandlers.value[index])
    })
  }

  const disableSync = () => {
    synchronizedMaps.value.forEach((map, index) => {
      map.off('move', moveHandlers.value[index])
    })
  }

  const removeMapFromSync = (map: MaplibreMap) => {
    const mapIndex = synchronizedMaps.value.indexOf(map)
    if (mapIndex !== -1) {
      map.off('move', moveHandlers.value[mapIndex])
      synchronizedMaps.value.splice(mapIndex, 1)
      moveHandlers.value.splice(mapIndex, 1)
    }
  }

  onMounted(() => {
    if (mapInstance) addMapToSync(mapInstance)
  })

  onUnmounted(() => {
    if (mapInstance) removeMapFromSync(mapInstance)
  })
}
