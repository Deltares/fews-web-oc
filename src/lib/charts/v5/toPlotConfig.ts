import {
  axis,
  type AlignGroup,
  band,
  bandScale,
  bar,
  createEnsemble,
  createTable,
  degreesScale,
  ensemble,
  handleCache,
  highlight,
  linearScale,
  line,
  series as seriesMark,
  timeScale,
  type AxisHandle,
  type BandMark,
  type BarMark,
  type CrosshairHandle,
  type EnsembleInput,
  type EnsembleMark,
  type EnsembleMemberMetadata,
  type MarkerSymbol,
  type LineMark,
  type HandleCache,
  type PlotConfig,
  type ScaleHandle,
  type SeriesMark,
  type SeriesOptions,
  type SeriesStore,
  type ThemeMode,
  type TableInput,
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
  colorContrast?: PlotConfig['colorContrast']
  themeElement?: Element
  verticalProfile?: boolean
  plugins?: PlotConfig['plugins']
  /** Crosshair the ensemble member highlight follows, including its snapping. */
  crosshair?: CrosshairHandle
  sharedTimeScale?: ScaleHandle<'time'>
  sharedElevationScale?: ScaleHandle<'linear'>
  align?: AlignGroup
  autoMargins?: boolean
  isBrush?: boolean
  /** Reuse one cache per plot; omitted for one-off configuration builds. */
  handles?: HandleCache
}

type YScale = {
  id: string
  axis: ChartAxis
}

type PlotMark = BandMark | BarMark | EnsembleMark | SeriesMark | LineMark

type MarkContext = {
  chartSeries: ChartSeries[]
  stores: Readonly<Record<string, SeriesStore>>
  resources: Record<string, Series>
  yScales: YScale[]
  handles: HandleCache
  verticalProfile: boolean
  stackedBarAxes: Set<string>
  ensembleMarks: EnsembleMark[]
}

export function toPlotConfig(
  config: ChartConfig,
  stores: Readonly<Record<string, SeriesStore>>,
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions = {},
  resources: Record<string, Series> = {},
): PlotConfig {
  const handles = options.handles ?? handleCache()
  return handles.collect(() =>
    buildPlotConfig(config, stores, settings, options, resources, handles),
  )
}

function buildPlotConfig(
  config: ChartConfig,
  stores: Readonly<Record<string, SeriesStore>>,
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions,
  resources: Record<string, Series>,
  handles: HandleCache,
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
    createScale('x', xAxis, options, handles, options.domain)
  const scales: Record<string, ScaleHandle> = { x: xScale }
  const directions: Record<string, 'x' | 'y'> = { x: 'x' }

  for (const { id, axis: yAxis } of yScales) {
    scales[id] =
      (options.verticalProfile &&
        id === 'y0' &&
        options.sharedElevationScale) ||
      createScale(id, yAxis, options, handles)
    directions[id] = 'y'
  }

  const { marks, ensembleMarks } = createMarks(
    config.series,
    stores,
    resources,
    yScales,
    handles,
    options.verticalProfile,
  )

  return {
    title: config.title,
    autoMargins: options.autoMargins ?? true,
    axisLayout: 'inset',
    background: 'canvas',
    clipMarks: true,
    margins: getV5PlotMargins(settings, options),
    align: options.align,
    theme: options.theme ?? 'auto',
    colorContrast: options.colorContrast ?? 'auto',
    themeElement: options.themeElement,
    scales,
    directions,
    axes: createAxes(xAxis, yScales, settings, options, handles),
    marks,
    plugins: createPlugins(ensembleMarks, options, handles),
  }
}

const ensembleMarkKeys = new WeakMap<EnsembleMark, number>()
let nextEnsembleMarkKey = 0

function ensembleMarkKey(mark: EnsembleMark): number {
  let key = ensembleMarkKeys.get(mark)
  if (key === undefined) {
    key = nextEnsembleMarkKey++
    ensembleMarkKeys.set(mark, key)
  }
  return key
}

/** Adds a highlight of the hovered ensemble member when the chart has ensembles. */
function createPlugins(
  ensembleMarks: EnsembleMark[],
  options: ToPlotConfigOptions,
  handles: HandleCache,
): PlotConfig['plugins'] {
  if (options.isBrush || ensembleMarks.length === 0) return options.plugins
  // An installed highlight validates its marks against the plot's current
  // marks on every update, before setConfig() hands the plot new marks. So
  // a changed set of ensemble marks gets a new highlight instead of an update.
  const marksKey = ensembleMarks.map(ensembleMarkKey).join(',')
  const ensembleHighlight = handles.use(
    `plugin:ensemble-highlight:${marksKey}`,
    highlight,
    {
      axis: options.verticalProfile ? 'y' : 'x',
      marks: ensembleMarks,
      crosshair: options.crosshair,
    },
  )
  return [...(options.plugins ?? []), ensembleHighlight]
}

export function getV5PlotMargins(
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: Pick<ToPlotConfigOptions, 'verticalProfile' | 'isBrush'> = {},
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

  return margins
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
  id: string,
  axisConfig: ChartAxis,
  options: ToPlotConfigOptions,
  handles: HandleCache,
  domain?: [Date, Date],
): ScaleHandle {
  const source = domain ?? axisConfig.domain
  const scaleDomain: [number, number] | undefined = source
    ? [Number(source[0]), Number(source[1])]
    : undefined
  const defaultDomain = axisConfig.defaultDomain ?? [0, 1]
  const common = {
    defaultDomain,
    includeZero: axisConfig.includeZero ?? false,
    nice: axisConfig.nice ?? true,
    reverse: axisConfig.reverse ?? false,
    locale: axisConfig.locale ?? options.locale ?? 'en',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  const numeric = scaleDomain ? { ...common, domain: scaleDomain } : common

  switch (axisConfig.kind) {
    case 'time':
      return handles.use(`scale:${id}`, timeScale, numeric)
    case 'degrees':
      return handles.use(`scale:${id}`, degreesScale, numeric)
    case 'band':
      return handles.use(`scale:${id}`, bandScale, {
        includeZero: common.includeZero,
        nice: common.nice,
        reverse: common.reverse,
        locale: common.locale,
        timeZone: common.timeZone,
      })
    default:
      return handles.use(`scale:${id}`, linearScale, numeric)
  }
}

function createAxes(
  xAxis: ChartAxis,
  yScales: YScale[],
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions,
  handles: HandleCache,
): AxisHandle[] {
  const axes: AxisHandle[] = []

  if (settings.xAxis.enabled) {
    axes.push(createXAxis(xAxis, settings, options, handles))
  }

  if (!settings.yAxis.enabled || options.isBrush) return axes

  axes.push(...createYAxes(yScales, settings, options, handles))
  return axes
}

function createXAxis(
  xAxis: ChartAxis,
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions,
  handles: HandleCache,
): AxisHandle {
  return handles.use('axis:x', axis, 'x', {
    position: xAxis.position === 'top' ? 'top' : 'bottom',
    label: settings.xAxis.xLabel ? (xAxis.label ?? '') : '',
    unit: xAxis.unit ?? '',
    // Gridlines only on the value axis: a time x-axis gets none by default.
    grid:
      !options.isBrush &&
      settings.xAxis.xTicks &&
      (xAxis.showGrid ?? xAxis.kind !== 'time'),
    tickCount: settings.xAxis.xTicks ? 6 : 1,
    style: 'classic',
    locale: xAxis.locale ?? options.locale,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(!settings.xAxis.xTicks ? { format: () => '' } : {}),
  })
}

function createYAxes(
  yScales: YScale[],
  settings:
    ChartsSettings['timeSeriesChart'] | ChartsSettings['verticalProfileChart'],
  options: ToPlotConfigOptions,
  handles: HandleCache,
): AxisHandle[] {
  const positions = yScales.map(({ axis }, index) =>
    getYAxisPosition(axis, index),
  )
  const hasLeftAxis = positions.includes('left')
  return yScales.map(({ id, axis: yAxis }, index) => {
    const position = positions[index]
    const isPrimary = position === 'left' || (!hasLeftAxis && index === 0)
    return handles.use(`axis:${id}`, axis, id, {
      position,
      label: settings.yAxis.yLabel ? (yAxis.label ?? '') : '',
      unit: yAxis.unit ?? '',
      grid: settings.yAxis.yTicks && (yAxis.showGrid ?? isPrimary),
      tickCount: settings.yAxis.yTicks ? 6 : 1,
      style: 'classic',
      locale: yAxis.locale ?? options.locale,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(!settings.yAxis.yTicks ? { format: () => '' } : {}),
    })
  })
}

function getYAxisPosition(yAxis: ChartAxis, index: number): 'left' | 'right' {
  if (yAxis.position === 'left' || yAxis.position === 'right') {
    return yAxis.position
  }
  return index === 0 ? 'left' : 'right'
}

function createMarks(
  chartSeries: ChartSeries[],
  stores: Readonly<Record<string, SeriesStore>>,
  resources: Record<string, Series>,
  yScales: YScale[],
  handles: HandleCache,
  verticalProfile = false,
): { marks: PlotMark[]; ensembleMarks: EnsembleMark[] } {
  const marks: PlotMark[] = []
  const context: MarkContext = {
    chartSeries,
    stores,
    resources,
    yScales,
    handles,
    verticalProfile,
    stackedBarAxes: new Set<string>(),
    ensembleMarks: [],
  }

  for (const [seriesIndex, item] of chartSeries.entries()) {
    marks.push(...createMarksForItem(item, seriesIndex, context))
  }

  return { marks, ensembleMarks: context.ensembleMarks }
}

function createMarksForItem(
  item: ChartSeries,
  seriesIndex: number,
  context: MarkContext,
): PlotMark[] {
  const { resources, yScales, handles, verticalProfile } = context
  if (item.visibleInPlot === false || item.type === 'dummy') return []
  const markId = `${seriesIndex}:${item.id}`
  const yScale = yScales[item.options.y.axisIndex]?.id ?? 'y0'

  if (
    !verticalProfile &&
    item.type === 'line' &&
    item.dataResources.length === 1
  ) {
    const mark = createEnsembleMark(item, markId, yScale, resources, handles)
    if (mark) {
      context.ensembleMarks.push(mark)
      return createEnsembleMarks(item, mark, markId, yScale, context)
    }
  }
  if (item.type === 'area' && item.dataResources.length > 1) {
    const mark = createBandMark(item, markId, yScale, resources, handles)
    return mark ? [mark] : []
  }
  if (item.type === 'bar') {
    const mark = createBarMark(item, markId, yScale, context)
    return mark ? [mark] : []
  }

  const markerItem =
    item.type === 'marker' || item.marker !== undefined ? item : undefined
  return createSeriesMarks(item, markerItem, markId, yScale, context)
}

function createEnsembleMarks(
  item: ChartSeries,
  mark: EnsembleMark,
  markId: string,
  yScale: string,
  context: MarkContext,
): PlotMark[] {
  if (!item.marker) return [mark]
  const markerItem: ChartSeries = {
    ...item,
    type: 'marker',
    style: item.markerStyle ?? item.style,
  }
  return [
    mark,
    ...createSeriesMarks(markerItem, markerItem, markId, yScale, context),
  ]
}

function createEnsembleMark(
  item: ChartSeries,
  markId: string,
  yScale: string,
  resources: Record<string, Series>,
  handles: HandleCache,
): EnsembleMark | undefined {
  const members = Object.entries(resources).filter(
    ([, resource]) => resource.ensemble?.requestKey === item.dataResources[0],
  )
  if (members.length === 0) return undefined

  const values = members.map(([, resource]) => {
    const byTime = new Map<number, number>()
    addDataToMap(byTime, resource.data ?? [])
    return byTime
  })
  const x = [...new Set(values.flatMap((data) => [...data.keys()]))].sort(
    (a, b) => a - b,
  )
  const rows: EnsembleInput = {
    x,
    members: values.map((data) =>
      x.map((time) => data.get(time) ?? Number.NaN),
    ),
  }
  const metadata = members.map(([id, resource]) => ({
    id,
    label: resource.ensemble!.memberId,
  }))
  const storeId = `${markId}:${JSON.stringify(metadata)}`
  const data = handles.use(`ensemble:${storeId}`, createEnsembleStore, {
    rows,
    metadata,
  })
  return handles.use(`mark:ensemble:${storeId}`, ensemble, data.store, {
    id: markId,
    x: 'x',
    y: yScale,
    label: item.name,
    legendGroup:
      item.visibleInLegend === false ? undefined : nonEmptyLabel(item.name),
    visible: true,
    renderer: 'svg',
    members: {
      stroke: styleValue(item, 'stroke'),
      width: styleNumber(item, 'stroke-width', 1),
      opacity: 1,
    },
    spread: false,
    median: false,
    mean: false,
    control: false,
    exceedance: false,
  })
}

function createBandMark(
  item: ChartSeries,
  markId: string,
  yScale: string,
  resources: Record<string, Series>,
  handles: HandleCache,
): BandMark | undefined {
  const pairedData = getPairedData(item.dataResources, resources)
  if (!pairedData) return undefined
  return handles.use(`mark:${markId}`, band, {
    id: markId,
    x: 'x',
    y: yScale,
    label: item.visibleInLegend === false ? undefined : item.name,
    legendGroup:
      item.visibleInLegend === false ? undefined : nonEmptyLabel(item.name),
    visible: true,
    xValues: pairedData.x,
    yValues: pairedData.y,
    fill: styleValue(item, 'fill'),
  })
}

function createBarMark(
  item: ChartSeries,
  markId: string,
  yScale: string,
  context: MarkContext,
): BarMark | undefined {
  const { chartSeries, resources, yScales, handles, stackedBarAxes } = context
  if (stackedBarAxes.has(yScale)) return undefined
  const barSeries = chartSeries.filter(
    (candidate) =>
      candidate.type === 'bar' &&
      candidate.visibleInPlot !== false &&
      (yScales[candidate.options.y.axisIndex]?.id ?? 'y0') === yScale &&
      resources[candidate.dataResources[0]]?.data !== undefined,
  )
  if (barSeries.length > 1) {
    stackedBarAxes.add(yScale)
    return createStackedBarMark(barSeries, yScale, resources, yScales, handles)
  }
  const rows = getBarData(item, resources)
  if (!rows) return undefined
  const data = handles.use(`table:${markId}`, createBarStore, { rows })
  return handles.use(`mark:${markId}`, bar, data.store, {
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
      item.visibleInLegend === false ? undefined : nonEmptyLabel(item.name),
    fill: styleValue(item, 'fill'),
    opacity: 1,
    stroke: styleValue(item, 'stroke'),
    strokeWidth: styleNumber(item, 'stroke-width', 1),
  })
}

function createStackedBarMark(
  barSeries: ChartSeries[],
  yScale: string,
  resources: Record<string, Series>,
  yScales: YScale[],
  handles: HandleCache,
): BarMark {
  const stackId = `stack:${yScale}:${barSeries.map((series) => series.id).join(':')}`
  const rows = getStackedBarData(barSeries, resources)
  const data = handles.use(`table:${stackId}`, createBarStore, { rows })
  return handles.use(`mark:${stackId}`, bar, data.store, {
    id: `${yScales.find(({ id }) => id === yScale)?.axis.label || 'Stacked bars'} (${yScale})`,
    x: 'x',
    scales: { x: 'x', y: yScale },
    renderer: 'svg',
    orientation: 'vertical',
    interval: { start: 'start', end: 'x' },
    layout: 'stacked',
    layers: barSeries.map((series, index) => ({
      id: `${index}:${series.id}`,
      y: `y${index}`,
      label: series.visibleInLegend === false ? undefined : series.name,
      fill: styleValue(series, 'fill'),
      stroke: styleValue(series, 'stroke'),
      strokeWidth: styleNumber(series, 'stroke-width', 1),
    })),
    groupPadding: 0.1,
    layerPadding: 0,
    visible: true,
    label: '',
    opacity: 1,
  })
}

function createSeriesMarks(
  item: ChartSeries,
  markerItem: ChartSeries | undefined,
  markId: string,
  yScale: string,
  context: MarkContext,
): (SeriesMark | LineMark)[] {
  const { stores, resources, handles, verticalProfile } = context
  const marks: (SeriesMark | LineMark)[] = []
  for (const [index, resourceId] of item.dataResources.entries()) {
    const store = stores[resourceId]
    const resource = resources[resourceId]
    if (verticalProfile ? !resource : !store) continue

    const options = createSeriesOptions(
      item,
      markerItem,
      `${markId}:${index}`,
      yScale,
    )
    if (verticalProfile) {
      marks.push(createProfileMark(resource, options))
    } else {
      marks.push(
        handles.use(`mark:${markId}:${index}`, seriesMark, store, options),
      )
    }
  }
  return marks
}

function createSeriesOptions(
  item: ChartSeries,
  markerItem: ChartSeries | undefined,
  id: string,
  yScale: string,
) {
  return {
    id,
    x: 'x',
    y: yScale,
    label: item.visibleInLegend === false ? '' : item.name,
    legendGroup:
      item.visibleInLegend === false ? undefined : nonEmptyLabel(item.name),
    visible: true,
    line: createLineOptions(item),
    markers: markerItem
      ? {
          symbol: markerSymbol(markerItem.marker?.shape),
          size: markerItem.marker?.size ?? 9,
          fill: markerStyleValue(markerItem, 'fill'),
          stroke: markerStyleValue(markerItem, 'stroke'),
          strokeWidth: markerStyleNumber(markerItem, 'stroke-width', 1),
        }
      : false,
    area:
      item.type === 'area'
        ? {
            to: 0,
            fill: styleValue(item, 'fill'),
            opacity: 1,
          }
        : false,
  } satisfies SeriesOptions
}

function createLineOptions(item: ChartSeries) {
  if (item.type !== 'line' && item.type !== 'rule') return false
  return {
    stroke: styleValue(item, 'stroke'),
    width: styleNumber(item, 'stroke-width', 1),
    strokeDasharray: styleValue(item, 'stroke-dasharray'),
    strokeLinecap:
      styleValue(item, 'stroke-linecap') === 'round' ? 'round' : 'butt',
    strokeLinejoin: 'round',
  } satisfies Exclude<SeriesOptions['line'], boolean | undefined>
}

function createProfileMark(
  resource: Series,
  options: ReturnType<typeof createSeriesOptions>,
): LineMark {
  // Profile values can reverse with elevation; SeriesStore requires sorted x.
  const data = resource.data ?? []
  return line({
    ...options,
    xValues: data.map((event) =>
      event.x !== null && Number.isFinite(Number(event.x))
        ? Number(event.x)
        : null,
    ),
    yValues: data.map((event) =>
      event.y !== null && Number.isFinite(event.y) && isReliableData(event)
        ? event.y
        : null,
    ),
    line: options.line !== false,
    stroke: options.line ? options.line.stroke : undefined,
    strokeWidth: options.line ? options.line.width : undefined,
    strokeDasharray: options.line ? options.line.strokeDasharray : undefined,
    strokeLinecap: options.line ? options.line.strokeLinecap : undefined,
    strokeLinejoin: options.line ? options.line.strokeLinejoin : undefined,
    area: options.area || undefined,
  })
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
  return { x, start, y }
}

function getStackedBarData(
  items: ChartSeries[],
  resources: Record<string, Series>,
): TableInput {
  const values = items.map((item) => {
    const byTime = new Map<number, number>()
    addDataToMap(byTime, resources[item.dataResources[0]].data ?? [])
    return byTime
  })
  const x = [...new Set(values.flatMap((byTime) => [...byTime.keys()]))].sort(
    (a, b) => a - b,
  )
  const rows: Record<string, number[]> = {
    x,
    start: x.map((time, index) => x[index - 1] ?? time),
  }
  for (const [index, byTime] of values.entries()) {
    rows[`y${index}`] = x.map((time) => byTime.get(time) ?? Number.NaN)
  }
  return rows
}

function createEnsembleStore({
  rows,
  metadata,
}: {
  rows: EnsembleInput
  metadata: EnsembleMemberMetadata[]
}) {
  const store = createEnsemble(rows, { metadata, precision: 'float64' })
  let currentRows = rows
  return {
    store,
    update({ rows }: { rows?: Partial<EnsembleInput> }) {
      if (rows) {
        currentRows = { ...currentRows, ...rows }
        store.replace(currentRows)
      }
    },
  }
}

function createBarStore({ rows }: { rows: TableInput }) {
  const store = createTable(rows, { x: 'x' })
  let currentRows = rows
  return {
    store,
    update({ rows }: { rows?: TableInput }) {
      if (rows) {
        // handleCache patches only changed columns; replace needs all columns.
        currentRows = { ...currentRows, ...rows }
        store.replace(currentRows)
      }
    },
  }
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

function markerStyleValue(item: ChartSeries, key: string) {
  const style = item.markerStyle ?? item.style
  const value = style[key as keyof typeof style]
  return typeof value === 'string' ? value : undefined
}

function markerStyleNumber(item: ChartSeries, key: string, fallback: number) {
  const value = Number.parseFloat(markerStyleValue(item, key) ?? '')
  return Number.isFinite(value) ? value : fallback
}

function nonEmptyLabel(label: string) {
  return label.trim() ? label : undefined
}
