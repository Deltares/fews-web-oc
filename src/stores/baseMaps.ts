import { defineStore } from 'pinia'
import type { BaseMap } from '@/lib/basemap'
import DefaultBaseMaps from '@/assets/DefaultBaseMaps.json'
import { useDark } from '@vueuse/core'

interface State {
  baseMaps: BaseMap[]
}

export const useBaseMapsStore = defineStore('basemaps', {
  state: (): State => ({
    baseMaps: [],
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
    getBaseMapById(id: string): BaseMap {
      if (id === 'automatic') {
        const isDark = useDark()
        return this.getBaseMapById(isDark.value ? 'dark' : 'light')
      }

      const baseMap = this.baseMaps.find((b) => b.id === id)
      if (baseMap) return baseMap

      const defaultBaseMap = DefaultBaseMaps.find(
        (basemap) => basemap.id === id,
      )
      if (defaultBaseMap) return defaultBaseMap

      return this.getBaseMapById('automatic')
    },
  },
})
