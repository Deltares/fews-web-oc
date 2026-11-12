import { defineStore } from 'pinia'
import {
  getFewsConfig,
  getLocalOrRemoteFileUrl,
} from '@/lib/fews-config/index.js'
import type { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import type { WebOcComponent } from '@/lib/fews-config/types'
import { RouteLocation } from 'vue-router'

interface ConfigState {
  version: string
  components: { [key: string]: WebOcComponent }
  general: WebOcGeneralConfig
}

function getComponentKey(component: WebOcComponent): string {
  return JSON.stringify(
    component.type === 'HtmlDisplay'
      ? [component.id, component.path]
      : [component.id],
  )
}

function findComponentById(
  components: ConfigState['components'],
  componentId: string,
): WebOcComponent | undefined {
  return Object.values(components)
    .reverse()
    .find((component) => component.id === componentId)
}

/**
 * Retrieves the menu icon for a given component configuration.
 * @param componentConfig - The configuration of the component.
 * @returns The icon string for the component.
 */
function getMenuIcon(componentConfig: WebOcComponent): string {
  const configuredIcon = componentConfig.icon ?? componentConfig.iconId
  if (configuredIcon) return configuredIcon
  switch (componentConfig.type) {
    case 'SpatialDisplay':
      return 'mdi-map'
    case 'SchematicStatusDisplay':
      return 'mdi-application-brackets-outline'
    case 'SystemMonitor':
      return 'mdi-clipboard-list'
    case 'TopologyDisplay':
      return 'mdi-map-marker-multiple'
    default:
      return ''
  }
}

function getToForComponent(component: WebOcComponent) {
  if (component.type === 'TopologyDisplay') {
    return {
      name: component.type,
      params: { topologyId: component.id },
    }
  }
  if (component.type === 'HtmlDisplay') {
    return {
      name: component.type,
      params: { path: component.path },
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
      this.components[getComponentKey(component)] = component
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

    getComponentByType<T extends WebOcComponent['type']>(
      componentType: T,
    ): Extract<WebOcComponent, { type: T }> | undefined {
      const component = Object.values(this.components).find(
        (component) => component.type === componentType,
      )
      if (component) component.icon = getMenuIcon(component)
      return component as Extract<WebOcComponent, { type: T }> | undefined
    },

    getComponentById(componentId: string) {
      const component = findComponentById(this.components, componentId)
      if (component) component.icon = getMenuIcon(component)
      return component
    },

    getComponentByRoute(route: RouteLocation) {
      const rootRoute = route.matched[0]
      if (rootRoute === undefined) return

      const rootRouteName = rootRoute.name?.toString() as WebOcComponent['type']
      if (
        rootRouteName === 'TopologyDisplay' &&
        route.params.topologyId !== undefined
      ) {
        return this.getComponentById(route.params.topologyId as string)
      }

      if (rootRouteName === 'HtmlDisplay' && route.params.path) {
        const component = this.getComponentsByType('HtmlDisplay').find(
          (component) => component.path === route.params.path,
        )
        if (component) component.icon = getMenuIcon(component)
        return component
      }

      return this.getComponentByType(rootRouteName)
    },

    getComponentsByType<T extends WebOcComponent['type']>(
      componentType: T,
    ): Extract<WebOcComponent, { type: T }>[] {
      const components = Object.values(this.components).filter(
        (component) => component.type === componentType,
      )

      return components as Extract<WebOcComponent, { type: T }>[]
    },
    async getCustomStyleSheet() {
      const defaultStyle = `${import.meta.env.BASE_URL}weboc-default-style.css`

      if (this.general.customStyleSheet) {
        const localPath = `${import.meta.env.BASE_URL}${this.general.customStyleSheet}`
        const remoteResource = this.general.customStyleSheet
        const customStyle = await getLocalOrRemoteFileUrl(
          localPath,
          remoteResource,
        )
        return customStyle ?? defaultStyle
      }

      return defaultStyle
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
        return findComponentById(
          state.components,
          state.general.defaultComponent,
        )
      }
    },
  },
})

export { useConfigStore }
