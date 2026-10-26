import type { Series } from '@/lib/timeseries/timeSeries'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type {
  AlignGroup,
  ScaleHandle,
  SharedPointer,
  SharedSelection,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from './ChartConfig'

export type ChartEngine = 'v4' | 'v5'
export type ChartWheelMode = 'x' | 'y' | 'xy' | 'none'

export interface V5ChartGroup {
  timeScale: ScaleHandle<'time'>
  brushTimeScale: ScaleHandle<'time'>
  elevationScale: ScaleHandle<'linear'>
  pointer: SharedPointer
  elevationPointer: SharedPointer
  align: AlignGroup
  selection: SharedSelection
  timeScaleInitialized: boolean
  brushTimeScaleInitialized: boolean
  elevationScaleInitialized: boolean
}

export interface ChartGroup {
  readonly id: symbol
  v5?: V5ChartGroup
}

export interface ChartMargin {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface TimeSeriesChartProps {
  config: ChartConfig
  series: Record<string, Series>
  highlightTime?: Date
  verticalProfile?: boolean
  forecastLegend?: string
  group?: ChartGroup
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart']
  maximized?: boolean
}

export interface TimeSeriesChartLegendEntry {
  selector: string
  label: string
}

export interface TimeSeriesChartExportOptions {
  legend: TimeSeriesChartLegendEntry[]
  container: HTMLElement
}

export interface TimeSeriesChartExpose {
  getSvgElement(): SVGSVGElement | null
  exportImage(options: TimeSeriesChartExportOptions): SVGSVGElement | undefined
}
