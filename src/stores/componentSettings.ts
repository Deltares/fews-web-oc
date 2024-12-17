import { getResourcesStaticUrl } from '@/lib/fews-config'
import { defineStore } from 'pinia'
import type {
  ComponentSettings,
  ComponentSettingsResponse,
  Declarations,
  OverlayLocation,
} from '@/lib/topology/componentSettings'

interface State {
  settings: ComponentSettings[]
  declarations?: Declarations
  selectedOverlayIds: string[]
  selectedBaseMapId?: string
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
    basemaps: (state) => {
      return state.declarations?.baseMaps
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
