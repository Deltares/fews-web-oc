import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import { PiWebserviceProvider, LogsDisplay } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'

interface State {
  logDisplays: LogsDisplay[]
}

export const useLogDisplaysStore = defineStore('logDisplays', {
  state: (): State => ({
    logDisplays: [],
  }),
  actions: {
    getById(logDisplayId: string | undefined) {
      return this.logDisplays.find(
        (logDisplay) => logDisplay.id === logDisplayId,
      )
    },
    async fetch() {
      if (this.logDisplays.length) return

      const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
      const piProvider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      try {
        const response = await piProvider.getLogDisplays()
        this.logDisplays = response.logDisplays
      } catch (error) {
        console.error(error)
      }
    },
  },
})
