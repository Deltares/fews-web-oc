import { defineStore } from 'pinia'
import { getFewsConfig } from '../lib/fews-config/index.js'
import { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import { ComponentTypeEnum, WebOcComponent } from '../lib/fews-config/types.js'

const WEBOC_CONFIG_PREFIX = 'delft-fews-weboc:config#'

interface ConfigState {
  version: string
  components: { [key: string]: WebOcComponent }
  general: WebOcGeneralConfig
}

function getMenuIcon(componentConfig: WebOcComponent): string {
  if (componentConfig.icon !== undefined) return componentConfig.icon
  switch (componentConfig.type) {
    case ComponentTypeEnum.DataViewer:
      return 'mdi-archive-search'
    case ComponentTypeEnum.SpatialDisplay:
      return 'mdi-map'
    case ComponentTypeEnum.SchematicStatusDisplay:
      return 'mdi-application-brackets-outline'
    case ComponentTypeEnum.TimeSeriesDisplay:
      return 'mdi-chart-sankey'
    case ComponentTypeEnum.SystemMonitor:
      return 'mdi-clipboard-list'
    default:
      return ''
  }
}

const useConfigStore = defineStore(
  'config',
  {
    state: (): ConfigState => ({
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
    getters: {
      activeComponents: (state) => {
        return Object.values(state.components).map((component: any) => {
          return {
            id: component.id,
            to: { name: component.type },
            title: component.title ?? '',
            icon: getMenuIcon(component),
          }
        })
      },
    },
  },
)

export { useConfigStore }
