import type {
  WebOcSchematicStatusDisplayConfig as WebOcSchematicStatusDisplayConfigUnTyped,
  WebOcSpatialDisplayConfig as WebOcSpatialDisplayConfigUnTyped,
  WebOcTopologyDisplayConfig as WebOcTopologyDisplayConfigUnTyped,
  WebOcSystemMonitorConfig as WebOcSystemMonitorConfigUnTyped,
  WebOcGeneralConfig,
} from '@deltares/fews-pi-requests'

// needs to be fixed in Open API schema

export interface WebOcSpatialDisplayConfig extends WebOcSpatialDisplayConfigUnTyped {
  type: 'SpatialDisplay'
}

export interface WebOcSchematicStatusDisplayConfig extends WebOcSchematicStatusDisplayConfigUnTyped {
  type: 'SchematicStatusDisplay'
}

export interface WebOcTopologyDisplayConfig extends WebOcTopologyDisplayConfigUnTyped {
  type: 'TopologyDisplay'
}

export interface WebOcSystemMonitorConfig extends WebOcSystemMonitorConfigUnTyped {
  type: 'SystemMonitor'
}

// needs to be added to Open API schema
interface HtmlDisplayConfig {
  id: string
  type: 'HtmlDisplay'
  icon: string
  iconId: string
  title: string
  path: string
  url: string
  showInNavigationMenu: boolean
}

export interface WebOcConfiguration {
  general: WebOcGeneralConfig
  webOcComponents: WebOcComponent[]
}

export type WebOcComponent =
  | WebOcSpatialDisplayConfig
  | WebOcSchematicStatusDisplayConfig
  | WebOcTopologyDisplayConfig
  | WebOcSystemMonitorConfig
  | HtmlDisplayConfig

export function hasDefaultPath(
  component: WebOcComponent,
): component is
  | WebOcSpatialDisplayConfig
  | WebOcSchematicStatusDisplayConfig
  | WebOcTopologyDisplayConfig {
  return (
    (
      component as
        | WebOcSpatialDisplayConfig
        | WebOcSchematicStatusDisplayConfig
        | WebOcTopologyDisplayConfig
    ).defaultPath !== undefined
  )
}
