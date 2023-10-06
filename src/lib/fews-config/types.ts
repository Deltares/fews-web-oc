import { WebOcGeneralConfig } from '@deltares/fews-pi-requests'

export interface WebOcConfiguration {
  general: WebOcGeneralConfig
  webOcComponents: WebOcComponent[]
}

export interface WebOcComponent {
  id: string
  type: ComponentType
  title?: string
  icon?: string
}

export const ComponentTypeEnum = {
  DataViewer: 'DataViewer',
  SpatialDisplay: 'SpatialDisplay',
  SchematicStatusDisplay: 'SchematicStatusDisplay',
  TimeSeriesDisplay: 'TimeSeriesDisplay',
  SystemMonitor: 'SystemMonitor',
  ArchiveDisplay: 'ArchiveDisplay',
  TopologyDisplay: 'TopologyDisplay',
} as const

export type ComponentType =
  (typeof ComponentTypeEnum)[keyof typeof ComponentTypeEnum]
