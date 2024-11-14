import { defineStore } from 'pinia'
import { getFewsConfig } from '../lib/fews-config/index.js'
import type { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import { ComponentTypeEnum, type WebOcComponent } from '@/lib/fews-config/types'
import { RouteLocation } from 'vue-router'

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
    case ComponentTypeEnum.TopologyDisplay:
      return 'mdi-map-marker-multiple'
    default:
      return ''
  }
}

function getToForComponent(component: WebOcComponent) {
  if (component.type === ComponentTypeEnum.TopologyDisplay) {
    return {
      name: component.type,
      params: { topologyId: component.id },
    }
  }
  return { name: component.type }
}

const useConfigStore = defineStore('config', {
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

    getComponentByType(componentType: string) {
      const component = Object.values(this.components).find(
        (component) => component.type === componentType,
      )
      if (component) component.icon = getMenuIcon(component)
      return component
    },

    getComponentById(componentId: string) {
      const component = this.components[componentId]
      if (component) component.icon = getMenuIcon(component)
      return component
    },

    getComponentByRoute(route: RouteLocation) {
      const rootRoute = route.matched[0]
      if (rootRoute === undefined) return

      const rootRouteName = rootRoute.name?.toString() ?? ''
      if (
        rootRouteName === 'TopologyDisplay' &&
        route.params.topologyId !== undefined
      ) {
        return this.getComponentById(route.params.topologyId as string)
      }

      return this.getComponentByType(rootRouteName)
    },

    getComponentsByType(componentType: string) {
      const components = Object.values(this.components)
        .filter((component) => component.type === componentType)
        .map((component) => {
          component.icon = getMenuIcon(component)
          return component
        })

      return components
    },
  },
  getters: {
    activeComponents: (state) => {
      return Object.values(state.components)
        .filter((component) => component.showInNavigationMenu ?? true)
        .map((component) => {
          return {
            id: component.id,
            to: getToForComponent(component),
            title: component.title ?? '',
            icon: getMenuIcon(component),
            showInNavigationMenu: component.showInNavigationMenu,
          }
        })
    },

    defaultComponent: (state) => {
      if (state.general.defaultComponent) {
        return state.components[state.general.defaultComponent]
      }
    },

    customStyleSheet: (state) => {
      if (state.general.customStyleSheet) {
        return `${import.meta.env.BASE_URL}${state.general.customStyleSheet}`
      } else {
        return `${import.meta.env.BASE_URL}weboc-default-style.css`
      }
    },
  },
})

export { useConfigStore }
