import { getResourcesStaticUrl } from '@/lib/fews-config'
import { defineStore } from 'pinia'
import type {
  WebocComponentSettings,
  WebocComponentSettingsResponse,
} from '@/lib/component-settings/types'

interface State {
  settings: WebocComponentSettings[]
}

export const useComponentSettingsStore = defineStore('componentSettings', {
  state: (): State => ({
    settings: [],
  }),
  actions: {
    async fetchState() {
      if (this.settings.length > 0) return

      const url = getResourcesStaticUrl('webocComponentSettings.json')
      const response = await fetch(url)
      const data: WebocComponentSettingsResponse = await response.json()
      this.settings = data.webocComponentSettings
    },
    getSettingsById(id: string) {
      return this.settings.find((s) => s.id === id)
    },
  },
})
