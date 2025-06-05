<template>
  <div
    class="chart-with-chips"
    :class="{ 'vertical-profile': verticalProfile }"
  >
    <ChartLegend
      :tags="legendTags"
      :margin="margin"
      :settings="settings.legend"
      @toggle-line="toggleLine"
    />
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  useTemplateRef,
} from 'vue'
import {
  AlertLines,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartMarker,
  ChartRule,
  CrossSectionSelect,
  Margin,
  TooltipAnchor,
  TooltipOptions,
  WheelMode,
  ZoomHandler,
  toggleChartVisibility,
  CartesianAxes,
  CurrentTime,
  MouseOver,
  VerticalMouseOver,
  DomainChangeEvent,
  ChartMatrix,
} from '@deltares/fews-web-oc-charts'
import ChartLegend from '@/components/charts/ChartLegend.vue'
import type { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import type { ChartSeries } from '../../lib/charts/types/ChartSeries.js'
import type { ThresholdLine } from '../../lib/charts/types/ThresholdLine.js'
import { Series } from '../../lib/timeseries/timeSeries.js'
import {
  dataFromResources,
  removeUnreliableData,
} from '@/lib/charts/dataFromResources'
import { extent } from 'd3'
import { difference, uniq } from 'lodash-es'
import { getMatchingIndexedString, type Tag } from '@/lib/charts/tags'
import { type ChartsSettings } from '@/lib/topology/componentSettings'
import { getAxisOptions } from '@/lib/charts/axisOptions'
import { PanHandler } from '@deltares/fews-web-oc-charts'
import {
  getColorMap,
  horizontalColorCodeDataFromData,
} from '@/lib/charts/horizontalColorCode.js'

interface Props {
  config: ChartConfig
  series?: Record<string, Series>
  highlightTime?: Date
  isLoading?: boolean
  zoomHandler?: ZoomHandler
  panHandler?: PanHandler
  verticalProfile?: boolean
  forecastLegend?: string
  settings: ChartsSettings['timeSeriesChart']
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      id: '',
      title: '',
      series: [],
    }
  },
  series: () => {
    return {}
  },
})

interface Emits {
  'update:x-domain': [new: [Date, Date]]
}
const emit = defineEmits<Emits>()

let thresholdLines!: ThresholdLine[]
let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
const margin = ref<Margin>({})
const legendTags = ref<Tag[]>([])
const showThresholds = ref(true)
const chartContainer = useTemplateRef('chartContainer')
const axisTime = ref<CrossSectionSelect>()
const hasRenderedOnce = ref(false)
const hasResetAxes = ref(true)

onMounted(() => {
  if (chartContainer.value) {
    const axisOptions = getAxisOptions(
      props.config,
      props.settings,
      props.verticalProfile,
    )
    axis = new CartesianAxes(
      chartContainer.value,
      props.verticalProfile ? 800 : null,
      props.verticalProfile ? 1200 : null,
      axisOptions,
    )
    axis.addEventListener('update:x-domain', onUpdateXDomain)

    // Keep margin in sync with axis.margin
    axis.margin = new Proxy(axis.margin, {
      set: (target, property, value) => {
        const res = Reflect.set(target, property, value)
        margin.value = { ...target }
        return res
      },
    })
    margin.value = { ...axis.margin }

    // Use custom number formatter that just converts the value to a string;
    // appropriate rounding has already been done by the backend.
    const mouseOver = props.verticalProfile
      ? new VerticalMouseOver(undefined, (value: number) => value.toString())
      : new MouseOver(undefined, (value: number) => value.toString())
    const zoom = props.zoomHandler ?? new ZoomHandler(WheelMode.NONE)
    const currentTime = new CurrentTime({ x: { axisIndex: 0 } })

    thresholdLinesVisitor = new AlertLines(thresholdLines)

    if (props.highlightTime !== undefined) {
      axisTime.value = new CrossSectionSelect(
        props.highlightTime,
        onCrossValueChange,
        { x: { axisIndex: 0 }, draggable: false },
        [],
      )
      axis.accept(axisTime.value)
    }
    if (props.panHandler) {
      axis.accept(props.panHandler)
    }

    axis.accept(thresholdLinesVisitor)
    axis.accept(zoom)
    axis.accept(mouseOver)
    axis.accept(currentTime)
    resize()
    onValueChange()
    window.addEventListener('resize', resize)
  }
})

const xTicksDisplay = computed(() =>
  props.settings.xAxis.xTicks ? undefined : 'none',
)
const yTicksDisplay = computed(() =>
  props.settings.yAxis.yTicks ? undefined : 'none',
)

watch(
  () => props.highlightTime,
  (newValue) => {
    if (newValue !== undefined) onCrossValueChange(newValue)
  },
)

function onUpdateXDomain(event: DomainChangeEvent): void {
  hasResetAxes.value = event.fromZoomReset
  emit('update:x-domain', event.new as [Date, Date])
}

function onCrossValueChange(value: number | Date) {
  if (axisTime.value) {
    axisTime.value.value = value
    axisTime.value.redraw()
  }
}

const addToChart = (chartSeries: ChartSeries) => {
  const id = chartSeries.id

  const rawData = dataFromResources(chartSeries.dataResources, props.series)
  const data = removeUnreliableData(rawData)

  const tooltip: TooltipOptions = {
    toolTipFormatter: (d) => {
      const tooltipElement = document.createElement('div')
      const yValueLabel = Array.isArray(d.y) ? d.y.join('-') : d.y
      tooltipElement.innerText = `${yValueLabel} ${chartSeries.unit}`
      return tooltipElement
    },
    anchor: TooltipAnchor.Top,
  }

  let chart
  switch (chartSeries.type) {
    case 'dummy':
      break
    case 'line':
      chart = new ChartLine(data, {})
      break
    case 'area':
      chart = new ChartArea(data, {})
      break
    case 'rule':
      chart = new ChartRule(data, { tooltip })
      break
    case 'bar':
      chart = new ChartBar(data, { tooltip })
      break
    case 'horizontalColorCode':
      const matrixData = horizontalColorCodeDataFromData(chartSeries, data)
      chart = new ChartMatrix(matrixData, {
        y: {
          paddingInner: chartSeries.barMargin,
        },
        color: {
          map: getColorMap(chartSeries.classBreaks),
        },
        tooltip,
      })
      break
    default:
      chart = new ChartMarker(data, {
        symbol: chartSeries.marker,
        tooltip,
      })
  }
  if (chart === undefined) return
  chart.addTo(axis, chartSeries.options, id, chartSeries.style)
}

const setThresholdLines = () => {
  const thresholdLinesData = props.config.thresholds
  if (thresholdLinesData === undefined || thresholdLinesData.length === 0)
    return

  if (!showThresholds.value) {
    thresholdLines = []
    let defaultDomain: [number, number] = [NaN, NaN]
    if (
      props.config.yAxis &&
      props.config.yAxis.length > 0 &&
      props.config.yAxis[0].defaultDomain
    ) {
      defaultDomain = props.config.yAxis[0].defaultDomain as any
    }
    axis.setOptions({
      y: [{ defaultDomain, nice: true }],
    })
  } else {
    thresholdLines = thresholdLinesData
    let defaultDomain: [number, number] = extent<number>(
      thresholdLinesData.map((l) => {
        return l.value ?? NaN
      }),
    ) as any
    if (
      props.config.yAxis &&
      props.config.yAxis.length > 0 &&
      props.config.yAxis[0].defaultDomain &&
      typeof props.config.yAxis[0].defaultDomain[0] === 'number' &&
      typeof props.config.yAxis[0].defaultDomain[1] === 'number'
    ) {
      defaultDomain = extent<number>([
        ...defaultDomain,
        ...props.config.yAxis[0].defaultDomain,
      ] as any) as any
    }
    axis.setOptions({
      y: [{ defaultDomain, nice: true }],
    })
  }

  thresholdLinesVisitor.options = thresholdLines
}

const clearChart = () => {
  axis.removeAllCharts()
}

const refreshChart = () => {
  /* Adds charts to the axis if not yet present, and removes charts that should no longer be there */
  const ids: string[] = axis.charts.map((c: any) => c.id)
  const removeIds: string[] = axis.charts.map((c: any) => c.id)
  if (props.config?.series === undefined) return
  for (const seriesData of props.config.series) {
    if (!seriesData.visibleInPlot) continue
    if (!ids.includes(seriesData.id)) {
      addToChart(seriesData)
    }
    const index = removeIds.findIndex((item) => {
      return item === seriesData.id
    })
    if (index >= 0) removeIds.splice(index, 1)
  }
  for (const id of removeIds) {
    axis.removeChart(id)
  }
  if (props.config.xAxis) {
    axis.setOptions({
      x: props.config.xAxis,
    })
  }
  if (props.config.yAxis) {
    axis.setOptions({
      y: props.config.yAxis,
    })
  }

  setThresholdLines()

  axis.redraw({
    x: {
      autoScale: true,
    },
    y: {
      autoScale: true,
    },
  })
  hasResetAxes.value = true
}

const updateChartData = (series: ChartSeries[]) => {
  let allMissingData = true
  series.forEach((series) => {
    const charts = axis.charts.filter((chart) => chart.id == series.id)
    if (charts.length === 0) return

    const hasMissingResource = series.dataResources.some(
      (id) => props.series[id] === undefined,
    )
    if (hasMissingResource) return

    const rawData = dataFromResources(series.dataResources, props.series)
    const data = removeUnreliableData(rawData)

    const matrixData =
      series.type === 'horizontalColorCode'
        ? horizontalColorCodeDataFromData(series, data)
        : undefined

    // Update each matching chart
    charts.forEach((chart) => {
      // Keep track of whether all charts had missing data before this data
      // update, in that case we should reset the y-axes as the domain is
      // probably [NaN, NaN].
      allMissingData &&= chart.data === undefined || chart.data.length === 0
      chart.data = matrixData ?? data
    })
  })
  const needsAxisRescale = allMissingData || hasResetAxes.value
  if (needsAxisRescale) {
    // Autoscale only the y-axis, the x-axis should keep the domain set from
    // the start and end time or zooming.
    axis.redraw({
      x: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
      y: { autoScale: true },
    })
    hasResetAxes.value = true
  } else {
    // Ensure the current zoom, which might be user-selected, does not change
    axis.redraw({
      x: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
      y: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
    })
    hasResetAxes.value = false
  }
}

function setTags() {
  const series = props.config?.series ?? []
  const isHorizontalColorCode = series.some(
    (s) => s.type === 'horizontalColorCode',
  )
  if (isHorizontalColorCode) {
    setHorizontalColorCodeTags(series)
  } else {
    setSeriesTags(series)
  }
  setThresholdTag()
}

function setSeriesTags(series: ChartSeries[]) {
  const s = new XMLSerializer()
  const ids = uniq(series.filter((s) => s.visibleInLegend).map((s) => s.id))

  legendTags.value = ids.map((id) => {
    const { svgGroup, legendSvg } = createChip()
    for (const chart of axis.charts) {
      if (chart.id === id) {
        let node = chart.drawLegendSymbol(undefined, true)
        svgGroup.appendChild(node)
      }
    }
    legendSvg.appendChild(svgGroup)
    const name = series.find((s) => s.id === id)?.name ?? ''
    return {
      id,
      name,
      disabled: false,
      legendSvg: s.serializeToString(legendSvg),
      tooltip: getMatchingIndexedString(name, props.forecastLegend),
      interactive: true,
    }
  })
}

function setHorizontalColorCodeTags(series: ChartSeries[]) {
  const s = new XMLSerializer()
  const classBreaks = series[0]?.classBreaks ?? []

  legendTags.value = classBreaks.map((classBreak) => {
    const { legendSvg } = createChip()

    // Create a rect svg with height and widht of 20px and color from classBreak
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '20')
    rect.setAttribute('height', '20')
    rect.setAttribute('fill', classBreak.color)

    legendSvg.appendChild(rect)

    return {
      id: classBreak.label,
      name: classBreak.label,
      disabled: false,
      interactive: false,
      legendSvg: s.serializeToString(legendSvg),
    }
  })
}

function setThresholdTag() {
  const thresholdsData = props.config?.thresholds
  if (!thresholdsData?.length) return

  const { svgGroup, legendSvg } = createChip()
  legendSvg.appendChild(svgGroup)
  const thresholdLegend: Tag = {
    id: 'Thresholds',
    name: 'Thresholds',
    disabled: false,
    legendSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21Z"/></svg>',
    interactive: true,
  }
  legendTags.value.push(thresholdLegend)
}

function createChip() {
  const legendSvg = document.createElement('svg')
  legendSvg.setAttribute('width', '20')
  legendSvg.setAttribute('height', '20')
  legendSvg.setAttribute('viewBox', '0 0 20 20')
  const svgGroup = document.createElement('g')
  svgGroup.setAttribute('transform', 'translate(0 10)')
  return { svgGroup, legendSvg }
}

const toggleLine = (tag: Tag) => {
  if (tag.id === 'Thresholds') {
    showThresholds.value = !tag.disabled
    setThresholdLines()
    axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
  } else {
    toggleChartVisibility(axis, tag.id)
  }
}

const resize = () => {
  nextTick(() => {
    axis.resize()
  })
}

const onValueChange = () => {
  clearChart()
  refreshChart()
  setTags()
}

const beforeDestroy = () => {
  window.removeEventListener('resize', resize)
}

watch(
  () =>
    Object.keys(props.series).map(
      (k) => `${k}-${props.series[k].lastUpdated?.getTime()}`,
    ),
  (newValue, oldValue) => {
    const newSeriesIds = difference(newValue, oldValue).map((id) =>
      id.substring(0, id.lastIndexOf('-')),
    )
    const requiredSeries = props.config?.series.filter((s) =>
      s.dataResources.some((resourceId) => newSeriesIds.includes(resourceId)),
    )
    if (requiredSeries.length > 0) {
      updateChartData(requiredSeries)

      if (!hasRenderedOnce.value) {
        axis.redraw({
          x: { autoScale: true },
          y: { autoScale: true },
        })
        hasRenderedOnce.value = true
      }
    }
  },
)
watch(() => props.config, onValueChange)
onBeforeUnmount(() => {
  beforeDestroy()
})
</script>

<style scoped>
.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 332px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
  max-height: none;
}

.chart-with-chips {
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1 1 80%;
  max-height: max(50%, 400px);
  width: 100%;
}

.chart-with-chips.vertical-profile {
  max-height: unset;
  max-width: 600px;
  flex: 1 1 80%;
  height: 100%;
}

:deep([class*='y-axis-'] > .tick) {
  display: v-bind(yTicksDisplay);
}

:deep([class*='x-axis-']) {
  display: v-bind(xTicksDisplay);
}
</style>
