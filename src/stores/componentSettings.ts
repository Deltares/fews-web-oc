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
  selectedBaseMapId: string
}

function isKeyOfDefaultStyle(key: string): key is keyof typeof DefaultBaseMaps {
  return key in DefaultBaseMaps
}

export const useComponentSettingsStore = defineStore('componentSettings', {
  state: (): State => ({
    settings: [],
    selectedOverlayIds: [],
    selectedBaseMapId: 'automatic',
  }),
  getters: {
    overlays: (state) => state.declarations?.overlays?.locations ?? [],
    selectedOverlays(): OverlayLocation[] {
      return this.selectedOverlayIds
        .map((id) => this.overlays.find((o) => o.id === id))
        .filter((o) => o !== undefined)
    },
    baseMaps: (state) => {
      const defaultBaseMaps: BaseMap[] = Object.values(DefaultBaseMaps)
      const baseMaps = state.declarations?.baseMaps ?? []
      return [...defaultBaseMaps, ...baseMaps]
    },
    selectedBaseMap(): BaseMap {
      if (this.selectedBaseMapId === 'automatic') {
        const isDark = useDark()
        return DefaultBaseMaps[isDark.value ? 'dark' : 'light']
      }
      if (isKeyOfDefaultStyle(this.selectedBaseMapId)) {
        return DefaultBaseMaps[this.selectedBaseMapId]
      }
      // FIXME: What to do if the selected base map is not found?
      //        Could happen when persisting the selected base map
      return (
        this.baseMaps.find((b) => b.id === this.selectedBaseMapId) ??
        this.baseMaps[0]
      )
    },
    selectedStyle(): string {
      const style = this.selectedBaseMap.style
      if (style.startsWith('/')) {
        return getResourcesStaticUrl(style.slice(1))
      }
      return style
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
  },
  persist: {
    key: 'weboc-component-settings-v1.0.0',
    storage: window.localStorage,
    omit: ['settings', 'declarations'],
  },
})
