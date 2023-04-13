export interface ConfigState {
  components: { [key: string]: WebOcComponent }
}

export interface WebOcComponent {
  id: string
  component: ComponentType
  title: string
  icon?: string
}

export const ComponentTypeEnum = {
  DataViewer:             'DataViewer',
  SpatialDisplay:         'SpatialDisplay',
  SchematicStatusDisplay: 'SchematicStatusDisplay',
  TimeSeriesDisplay:      'TimeSeriesDisplay',
  SystemMonitor:          'SystemMonitor',
  ArchiveDisplay:         'ArchiveDisplay'
} as const

export type ComponentType = (typeof ComponentTypeEnum)[keyof typeof ComponentTypeEnum];
