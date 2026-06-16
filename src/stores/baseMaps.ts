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
    baseMaps: DefaultBaseMaps,
    defaultDarkId: 'dark',
    defaultLightId: 'light',
  }),
  getters: {
    allBaseMaps(): BaseMap[] {
      return this.baseMaps
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

      return this.getBaseMapById('automatic', isDark)
    },
  },
})
