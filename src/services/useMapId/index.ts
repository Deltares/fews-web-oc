import { inject, provide } from 'vue'

const MAP_ID_KEY = Symbol('mapId')
const DEFAULT_MAP_ID = 'mainMap'

export function provideMapId(mapId: string) {
  provide(MAP_ID_KEY, mapId)
}

export function useMapId() {
  return inject(MAP_ID_KEY, DEFAULT_MAP_ID)
}
