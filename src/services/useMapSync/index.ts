import { ref, onUnmounted, onMounted } from 'vue'
import type { Map as MaplibreMap } from 'maplibre-gl'

const synchronizedMaps = ref<MaplibreMap[]>([])
const moveHandlers = ref<Parameters<MaplibreMap['on']>[1][]>([])

/**
 * Synchronize movements of multiple maps.
 *
 * This ensures that interactions resulting in map movements
 * are mirrored across all synchronized maps without causing
 * infinite loops or interrupting prolonged movements.
 */
export function useMapSync(mapInstance: MaplibreMap | undefined) {
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
