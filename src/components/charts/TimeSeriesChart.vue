<template>
  <div
    class="chart-with-chips mt-1"
    :class="{ 'vertical-profile': verticalProfile }"
  >
    <ChartLegend
      v-if="settings.legend.show"
      :tags="legendTags"
      :margin="margin"
      :settings="settings.legend"
      @toggle-line="toggleLine"
    />
    <LoadingOverlay v-if="isLoading" :offsets="margin" />
    <div ref="chartContainer" class="chart-container" v-show="!isLoading"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import {
  AlertLines,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartMarker,
  ChartRule,
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
} from '@deltares/fews-web-oc-charts'
import LoadingOverlay from '@/components/charts/LoadingOverlay.vue'
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
import type { Tag } from '@/lib/charts/tags'
import { type ChartSettings } from '@/lib/topology/componentSettings'
import { getAxisOptions } from '@/lib/charts/axisOptions'

interface Props {
  config?: ChartConfig
  series?: Record<string, Series>
  currentTime?: Date
  isLoading?: boolean
  zoomHandler?: ZoomHandler
  verticalProfile?: boolean
  settings: ChartSettings['timeseriesChart']
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      series: [],
    }
  },
  series: () => {
    return {}
  },
  currentTime: () => {
    return new Date()
  },
})

let thresholdLines!: ThresholdLine[]
let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
let margin: Margin = {}
const legendTags = ref<Tag[]>([])
const showThresholds = ref(true)
const chartContainer = ref<HTMLElement>()
const axisTime = ref<CurrentTime>()

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
    margin = axis.margin
    const mouseOver = props.verticalProfile
      ? new VerticalMouseOver()
      : new MouseOver()
    const zoom = props.zoomHandler ?? new ZoomHandler(WheelMode.NONE)
    axisTime.value = new CurrentTime({
      x: {
        axisIndex: 0,
      },
    })
    axisTime.value.setDateTime(props.currentTime)

    thresholdLinesVisitor = new AlertLines(thresholdLines)

    axis.accept(thresholdLinesVisitor)
    axis.accept(zoom)
    axis.accept(mouseOver)
    axis.accept(axisTime.value)
    resize()
    if (props.config !== undefined) {
      refreshChart()
      setTags()
    }
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
  () => props.currentTime,
  (newValue) => {
    if (axisTime.value) {
      axisTime.value.setDateTime(newValue)
      onValueChange()
    }
  },
)

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
    default:
      chart = new ChartMarker(data, {
        symbol: chartSeries.marker,
        tooltip,
      })
  }
  if (chart === undefined) return
  chart.addTo(
    axis,
    {
      x: {
        key: 'x',
        axisIndex: 0,
      },
      y: {
        key: 'y',
        axisIndex: chartSeries.options.y.axisIndex,
      },
    },
    id,
    chartSeries.style,
  )
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
}

const setTags = () => {
  const s = new XMLSerializer()
  const seriesData = props.config?.series
  if (seriesData === undefined) {
    legendTags.value = []
  } else {
    const ids = uniq(
      seriesData.filter((s) => s.visibleInLegend).map((s) => s.id),
    )
    legendTags.value = ids.map((id) => {
      const { svgGroup, legendSvg } = createChip()
      for (const chart of axis.charts) {
        if (chart.id === id) {
          let node = chart.drawLegendSymbol(undefined, true)
          svgGroup.appendChild(node)
        }
      }
      legendSvg.appendChild(svgGroup)
      const name = seriesData.find((s) => s.id === id)?.name || ''
      return {
        id: id,
        name: name || '',
        disabled: false,
        legendSvg: s.serializeToString(legendSvg),
      }
    })
  }
  const thresholdsData = props.config?.thresholds
  if (thresholdsData !== undefined && thresholdsData.length > 0) {
    const { svgGroup, legendSvg } = createChip()
    legendSvg.appendChild(svgGroup)
    const thresholdLegend = {
      id: 'Thresholds',
      name: 'Thresholds',
      disabled: false,
      legendSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21Z"/></svg>',
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
    const newSeriesIds = difference(newValue, oldValue)
    const requiredSeriesIds = props.config?.series.filter((s) =>
      newSeriesIds.map((id) => id.split('-')[0]).includes(s.id),
    )
    if (requiredSeriesIds.length > 0) {
      onValueChange()
    }
  },
)
watch(props.config, onValueChange)

onBeforeUnmount(() => {
  beforeDestroy()
})
</script>

<style scoped>
.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 400px;
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
  min-height: 150px;
  height: 100%;
  max-height: 800px;
}

.chart-with-chips.vertical-profile {
  max-height: unset;
  max-width: 600px;
}

:deep([class*='y-axis-'] > .tick) {
  display: v-bind(yTicksDisplay);
}

:deep([class*='x-axis-']) {
  display: v-bind(xTicksDisplay);
}
</style>
