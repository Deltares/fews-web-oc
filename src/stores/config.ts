import { defineStore } from 'pinia'
import { getFewsConfig } from '../lib/fews-config/index.js'
import { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import { WebOcComponent } from '../lib/fews-config/types.js'

const WEBOC_CONFIG_PREFIX = 'delft-fews-weboc:config#'

interface State {
  version: string
  components: { [key: string]: WebOcComponent }
  general: WebOcGeneralConfig
}

interface Actions {
  addComponent(component: WebOcComponent): void
  setGeneral(config: WebOcGeneralConfig): void
  setFewsConfig(): Promise<void>
}

const useConfigStore = defineStore<'config', State, {}, Actions>('config', {
  state: () => ({
    version: '0.1.0',
    components: {},
    general: {},
  }),

  actions: {
    addComponent(component: WebOcComponent) {
      this.components[component.id] = component
    },

    setGeneral(generalConfig: WebOcGeneralConfig) {
      this.general = generalConfig
    },

    async setFewsConfig() {
      if (Object.keys(this.components).length === 0) {
        const webOcConfiguration = await getFewsConfig()
        for (const webOcComponent of webOcConfiguration.webOcComponents) {
          this.addComponent(webOcComponent)
        }
        this.setGeneral(webOcConfiguration.general)
      }
    },
  },
})

export { useConfigStore }
