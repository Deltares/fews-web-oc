import { getResourcesStaticUrl } from '@/lib/fews-config'
import { defineStore } from 'pinia'
import DefaultBaseMaps from '@/assets/DefaultBaseMaps.json'
import type {
  BaseMap,
  ComponentSettings,
  ComponentSettingsResponse,
  Declarations,
  OverlayLocation,
} from '@/lib/topology/componentSettings'
import { useDark } from '@vueuse/core'

interface State {
  settings: ComponentSettings[]
  declarations?: Declarations
  selectedOverlayIds: string[]
}

export const useComponentSettingsStore = defineStore('componentSettings', {
  state: (): State => ({
    settings: [],
    selectedOverlayIds: [],
  }),
  getters: {
    overlays: (state) => state.declarations?.overlays?.locations ?? [],
    selectedOverlays(): OverlayLocation[] {
      return this.selectedOverlayIds
        .map((id) => this.overlays.find((o) => o.id === id))
        .filter((o) => o !== undefined)
    },
    baseMaps: (state) => {
      const defaultBaseMaps: BaseMap[] = DefaultBaseMaps
      const baseMaps = state.declarations?.baseMaps ?? []
      return [...defaultBaseMaps, ...baseMaps]
    },
  },
  actions: {
    async fetchState() {
      if (this.settings.length > 0) return

      const url = getResourcesStaticUrl('webocComponentSettings.json')
      const response = await fetch(url)
      const data: ComponentSettingsResponse = await response.json()
      this.settings = data.componentSettings
      this.declarations = data.declarations
    },
    getSettingsById(id: string) {
      return this.settings.find((s) => s.id === id)
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

      // FIXME: What to do if the selected base map is not found?
      //        Could happen when persisting the selected base map
      console.error(`Base map with id ${id} not found`)
      return this.getBaseMapById('automatic')
    },
  },
  persist: {
    key: 'weboc-component-settings-v1.0.0',
    storage: window.localStorage,
    omit: ['settings', 'declarations'],
  },
})
