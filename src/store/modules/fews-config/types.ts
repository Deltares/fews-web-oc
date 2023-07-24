export interface ConfigState {
  version: string
  components: { [key: string]: WebOcComponent }
}

export interface WebOcComponent {
  id: string
  type: ComponentType
  title?: string
  icon?: string
}

export const ComponentTypeEnum = {
  DataViewer:             'DataViewer',
  SpatialDisplay:         'SpatialDisplay',
  SchematicStatusDisplay: 'SchematicStatusDisplay',
  TimeSeriesDisplay:      'TimeSeriesDisplay',
  SystemMonitor:          'SystemMonitor',
  ArchiveDisplay:         'ArchiveDisplay',
  MetocDataViewer:        'MetocDataViewer'
} as const

export type ComponentType = (typeof ComponentTypeEnum)[keyof typeof ComponentTypeEnum];
