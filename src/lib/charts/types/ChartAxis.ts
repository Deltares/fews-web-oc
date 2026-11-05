export type ChartAxisKind = 'time' | 'value' | 'degrees' | 'band'
export type ChartAxisPosition = 'left' | 'right' | 'bottom' | 'top'
export type ChartAxisDomain = [number, number] | [Date, Date]

export interface ChartAxis {
  kind: ChartAxisKind
  position?: ChartAxisPosition
  label?: string
  domain?: ChartAxisDomain
  defaultDomain?: [number, number]
  includeZero?: boolean
  reverse?: boolean
  nice?: boolean
  showGrid?: boolean
  showAxis?: boolean
  labelOffset?: number
  unit?: string
  locale?: string
}
