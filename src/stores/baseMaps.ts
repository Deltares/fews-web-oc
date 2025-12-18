import { defineStore } from 'pinia'
import type { BaseMap } from '@/lib/basemap'
import DefaultBaseMaps from '@/assets/DefaultBaseMaps.json'

interface State {
  baseMaps: BaseMap[]
  defaultLightId: string
  defaultDarkId: string
}

export const useBaseMapsStore = defineStore('basemaps', {
  state: (): State => ({
    baseMaps: [],
    defaultDarkId: 'dark',
    defaultLightId: 'light',
  }),
  getters: {
    allBaseMaps(): BaseMap[] {
      return [...DefaultBaseMaps, ...this.baseMaps]
    },
  },
  actions: {
    setBaseMaps(baseMaps: BaseMap[]): void {
      this.baseMaps = baseMaps
    },
    getBaseMapById(id: string, isDark: boolean): BaseMap {
      if (id === 'automatic') {
        const newId = isDark ? this.defaultDarkId : this.defaultLightId
        return this.getBaseMapById(newId, isDark)
      }

      const baseMap = this.baseMaps.find((b) => b.id === id)
      if (baseMap) return baseMap

      const defaultBaseMap = DefaultBaseMaps.find(
        (basemap) => basemap.id === id,
      )
      if (defaultBaseMap) return defaultBaseMap

      return this.getBaseMapById('automatic', isDark)
    },
  },
})
