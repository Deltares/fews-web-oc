import {
  axis,
  band,
  bandScale,
  bar,
  createTable,
  degreesScale,
  linearScale,
  series as seriesMark,
  timeScale,
  type AxisHandle,
  type BandMark,
  type BarMark,
  type MarkerSymbol,
  type PlotConfig,
  type ScaleHandle,
  type SeriesMark,
  type SeriesStore,
  type ThemeMode,
} from '@deltares/fews-web-oc-charts'
import type { ChartAxis } from '@/lib/charts/types/ChartAxis'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { SeriesData } from '@/lib/timeseries/types/SeriesData'
import { isReliableData } from '@/lib/charts/dataFromResources'

export interface ToPlotConfigOptions {
  domain?: [Date, Date]
  locale?: string
  theme?: ThemeMode
  themeElement?: Element
  verticalProfile?: boolean
  plugins?: PlotConfig['plugins']
  sharedTimeScale?: ScaleHandle
  margins?: Partial<PlotConfig['margins']>
  autoMargins?: boolean
  isBrush?: boolean
}

type YScale = {
  id: string
  axis: ChartAxis
}

export function toPlotConfig(
  config: ChartConfig,
  stores: Readonly<Record<string, SeriesStore>>,
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions = {},
  resources: Record<string, Series> = {},
): PlotConfig {
  const xAxis =
    config.xAxis?.find((candidate) =>
      ['bottom', 'top'].includes(candidate.position ?? 'bottom'),
    ) ??
    ({
      kind: options.verticalProfile ? 'value' : 'time',
      position: 'bottom',
    } satisfies ChartAxis)
  const yScales = getYScales(config.yAxis)
  const xScale =
    (!options.verticalProfile && options.sharedTimeScale) ||
    createScale(xAxis, options, options.domain)
  const scales: Record<string, ScaleHandle> = { x: xScale }
  const directions: Record<string, 'x' | 'y'> = { x: 'x' }

  for (const { id, axis: yAxis } of yScales) {
    scales[id] = createScale(yAxis, options)
    directions[id] = 'y'
  }

  return {
    title: config.title,
    autoMargins: options.autoMargins ?? true,
    axisLayout: 'inset',
    background: 'chart',
    clipMarks: true,
    margins: getV5PlotMargins(settings, options),
    theme: options.theme ?? 'auto',
    themeElement: options.themeElement,
    scales,
    directions,
    axes: options.isBrush ? [] : createAxes(xAxis, yScales, settings, options),
    marks: createMarks(config.series, stores, resources, yScales),
    plugins: options.plugins,
  }
}

export function getV5PlotMargins(
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: Pick<
    ToPlotConfigOptions,
    'verticalProfile' | 'isBrush' | 'margins'
  > = {},
): NonNullable<PlotConfig['margins']> {
  const margins = {
    top: 25,
    right: 50,
    bottom: 40,
    left: 50,
  }

  if (options.verticalProfile) {
    margins.left = 70
    margins.right = 30
  }
  if (!settings.yAxis.yLabel) {
    margins.top = 20
  }
  if (settings.legend.placement.includes('under')) {
    margins.top = 40
    margins.bottom = 25
  }
  if (options.isBrush) {
    margins.top = 5
    margins.bottom = 25
  }

  return {
    ...margins,
    ...(options.margins?.top !== undefined ? { top: options.margins.top } : {}),
    ...(options.margins?.right !== undefined
      ? { right: options.margins.right }
      : {}),
    ...(options.margins?.bottom !== undefined
      ? { bottom: options.margins.bottom }
      : {}),
    ...(options.margins?.left !== undefined
      ? { left: options.margins.left }
      : {}),
  }
}

function getYScales(axes: ChartAxis[] = []): YScale[] {
  const configured = axes.filter((candidate) =>
    ['left', 'right'].includes(candidate.position ?? 'left'),
  )
  const defaults =
    configured.length > 0
      ? configured
      : [{ kind: 'value', position: 'left' } satisfies ChartAxis]

  return defaults.map((axis, index) => ({
    id: `y${index}`,
    axis,
  }))
}

function createScale(
  axisConfig: ChartAxis,
  options: ToPlotConfigOptions,
  domain?: [Date, Date],
): ScaleHandle {
  const scaleDomain: number[] | undefined = domain
    ? domain.map((value) => value.getTime())
    : axisConfig.domain?.map((value) =>
        value instanceof Date ? value.getTime() : value,
      )
  const defaultDomain = axisConfig.defaultDomain ?? [0, 1]
  const common = {
    ...(scaleDomain ? { domain: scaleDomain } : {}),
    defaultDomain,
    includeZero: axisConfig.includeZero ?? false,
    nice: axisConfig.nice ?? true,
    reverse: axisConfig.reverse ?? false,
    locale: axisConfig.locale ?? options.locale ?? 'en',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }

  switch (axisConfig.kind) {
    case 'time':
      return timeScale(common)
    case 'degrees':
      return degreesScale(common)
    case 'band':
      return bandScale(common)
    default:
      return linearScale(common)
  }
}

function createAxes(
  xAxis: ChartAxis,
  yScales: YScale[],
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions,
): AxisHandle[] {
  const axes: AxisHandle[] = []

  if (settings.xAxis.enabled) {
    axes.push(
      axis('x', {
        position: xAxis.position === 'top' ? 'top' : 'bottom',
        label: settings.xAxis.xLabel ? (xAxis.label ?? '') : '',
        unit: xAxis.unit ?? '',
        grid: settings.xAxis.xTicks && (xAxis.showGrid ?? true),
        tickCount: settings.xAxis.xTicks ? 6 : 1,
        style: 'classic',
        locale: xAxis.locale ?? options.locale,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(!settings.xAxis.xTicks ? { format: () => '' } : {}),
      }),
    )
  }

  if (settings.yAxis.enabled) {
    for (const [index, { id, axis: yAxis }] of yScales.entries()) {
      const position =
        yAxis.position === 'right'
          ? 'right'
          : yAxis.position === 'left'
            ? 'left'
            : index === 0
              ? 'left'
              : 'right'
      const isPrimary = position === 'left'
      axes.push(
        axis(id, {
          position,
          label: settings.yAxis.yLabel ? (yAxis.label ?? '') : '',
          unit: yAxis.unit ?? '',
          grid: settings.yAxis.yTicks && (yAxis.showGrid ?? isPrimary),
          tickCount: settings.yAxis.yTicks ? 6 : 1,
          style: 'classic',
          locale: yAxis.locale ?? options.locale,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(!settings.yAxis.yTicks ? { format: () => '' } : {}),
        }),
      )
    }
  }

  return axes
}

function createMarks(
  chartSeries: ChartSeries[],
  stores: Readonly<Record<string, SeriesStore>>,
  resources: Record<string, Series>,
  yScales: YScale[],
): (BandMark | BarMark | SeriesMark)[] {
  const marks: (BandMark | BarMark | SeriesMark)[] = []

  for (const [seriesIndex, item] of chartSeries.entries()) {
    if (item.visibleInPlot === false || item.type === 'dummy') continue
    const markId = `${seriesIndex}:${item.id}`
    const yScale = yScales[item.options.y.axisIndex]?.id ?? 'y0'

    if (item.type === 'area' && item.dataResources.length > 1) {
      const pairedData = getPairedData(item.dataResources, resources)
      if (!pairedData) continue
      marks.push(
        band({
          id: markId,
          x: 'x',
          y: yScale,
          xValues: pairedData.x,
          yValues: pairedData.y,
          fill: styleValue(item, 'fill'),
          label: item.visibleInLegend === false ? undefined : item.name,
          legendGroup:
            item.visibleInLegend === false
              ? undefined
              : nonEmptyLabel(item.name),
          visible: true,
        }),
      )
      continue
    }

    if (item.type === 'bar') {
      const data = getBarData(item, resources)
      if (!data) continue
      marks.push(
        bar(data.store, {
          id: markId,
          x: 'x',
          y: 'y',
          scales: { x: 'x', y: yScale },
          renderer: 'svg',
          orientation: 'vertical',
          interval: { start: 'start', end: 'x' },
          groupPadding: 0.1,
          layerPadding: 0,
          visible: true,
          label: item.visibleInLegend === false ? '' : item.name,
          legendGroup:
            item.visibleInLegend === false
              ? undefined
              : nonEmptyLabel(item.name),
          fill: styleValue(item, 'fill'),
          opacity: 1,
          stroke: styleValue(item, 'stroke'),
          strokeWidth: styleNumber(item, 'stroke-width', 1),
        }),
      )
      continue
    }

    const resourceIds = item.dataResources
    for (const [index, resourceId] of resourceIds.entries()) {
      const store = stores[resourceId]
      if (!store) continue

      const marker = item.type === 'marker' || item.marker !== undefined
      const isArea = item.type === 'area'
      marks.push(
        seriesMark(store, {
          id: `${markId}:${index}`,
          x: 'x',
          y: yScale,
          label: item.visibleInLegend === false ? '' : item.name,
          legendGroup:
            item.visibleInLegend === false
              ? undefined
              : nonEmptyLabel(item.name),
          visible: true,
          line:
            item.type === 'line' || item.type === 'rule'
              ? {
                  stroke: styleValue(item, 'stroke'),
                  width: styleNumber(item, 'stroke-width', 1),
                  strokeDasharray: styleValue(item, 'stroke-dasharray'),
                  strokeLinecap:
                    styleValue(item, 'stroke-linecap') === 'round'
                      ? 'round'
                      : 'butt',
                  strokeLinejoin: 'round',
                }
              : false,
          markers: marker
            ? {
                symbol: markerSymbol(item.marker?.shape),
                size: item.marker?.size ?? 9,
                fill: styleValue(item, 'fill'),
                stroke: styleValue(item, 'stroke'),
                strokeWidth: styleNumber(item, 'stroke-width', 1),
              }
            : false,
          area: isArea
            ? {
                to: 0,
                fill: styleValue(item, 'fill'),
                opacity: 1,
              }
            : false,
        }),
      )
    }
  }

  return marks
}

function getPairedData(
  resourceIds: string[],
  resources: Record<string, Series>,
):
  | {
      x: ([number, number] | null)[]
      y: ([number, number] | null)[]
    }
  | undefined {
  const [firstId, secondId] = resourceIds
  const first = resources[firstId]?.data
  const second = resources[secondId]?.data
  if (!first || !second) return undefined

  const firstByTime = new Map<number, number>()
  const secondByTime = new Map<number, number>()
  addDataToMap(firstByTime, first)
  addDataToMap(secondByTime, second)
  const x = [...new Set([...firstByTime.keys(), ...secondByTime.keys()])].sort(
    (a, b) => a - b,
  )

  const xRanges = x.slice(0, -1).map((time, index) => {
    return [time, x[index + 1]] as [number, number]
  })

  return {
    x: xRanges,
    y: x.slice(0, -1).map((time) => {
      const low = firstByTime.get(time)
      const high = secondByTime.get(time)
      return low === undefined ||
        high === undefined ||
        !Number.isFinite(low) ||
        !Number.isFinite(high)
        ? null
        : [low, high]
    }),
  }
}

function addDataToMap(map: Map<number, number>, data: SeriesData[]) {
  for (const event of data) {
    if (event.x === null) continue
    const time = event.x instanceof Date ? event.x.getTime() : event.x
    if (!Number.isFinite(time)) continue
    map.set(
      time,
      event.y === null || !Number.isFinite(event.y) || !isReliableData(event)
        ? Number.NaN
        : event.y,
    )
  }
}

function getBarData(item: ChartSeries, resources: Record<string, Series>) {
  const resource = resources[item.dataResources[0]]
  if (!resource?.data) return undefined
  const timedRows = resource.data.filter(
    (event) =>
      event.x !== null &&
      Number.isFinite(event.x instanceof Date ? event.x.getTime() : event.x),
  )
  const times = timedRows.map((event) =>
    event.x instanceof Date ? event.x.getTime() : event.x!,
  )
  const x: number[] = []
  const start: number[] = []
  const y: number[] = []
  for (const [index, event] of timedRows.entries()) {
    if (event.y === null || !Number.isFinite(event.y) || !isReliableData(event))
      continue
    x.push(times[index])
    // FEWS bars represent the interval ending at the sample timestamp.
    start.push(times[index - 1] ?? times[index])
    y.push(event.y)
  }
  return { store: createTable({ x, start, y }, { x: 'x' }) }
}

function markerSymbol(shape?: string): MarkerSymbol {
  switch (shape) {
    case 'triangle-up':
    case 'triangle-down':
    case 'triangle-left':
    case 'triangle-right':
    case 'cross':
    case 'diamond':
    case 'square':
    case 'star':
    case 'wye':
    case 'x':
    case 'plus':
    case 'rectangle':
      return shape
    default:
      return 'circle'
  }
}

function styleValue(item: ChartSeries, key: string) {
  const value = item.style[key as keyof typeof item.style]
  return typeof value === 'string' ? value : undefined
}

function styleNumber(item: ChartSeries, key: string, fallback: number) {
  const value = Number.parseFloat(styleValue(item, key) ?? '')
  return Number.isFinite(value) ? value : fallback
}

function nonEmptyLabel(label: string) {
  return label.trim() ? label : undefined
}
