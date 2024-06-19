<template>
  <div class="chart-with-chips">
    <LoadingOverlay v-if="isLoading" :offsets="margin" height="80%" />
    <div ref="chartContainer" class="chart-container" v-show="!isLoading"></div>
    <v-sheet
      class="chart-controls"
      rounded
      :max-height="expanded ? undefined : LEGEND_HEIGHT"
      :min-height="LEGEND_HEIGHT"
      :elevation="expanded ? 6 : 0"
    >
      <v-chip-group
        ref="chipGroup"
        column
        :class="['chart-legend', { 'chart-legend--large': requiresExpand }]"
      >
        <v-chip
          size="small"
          :variant="tag.disabled ? 'text' : 'tonal'"
          label
          v-for="tag in legendTags"
          :key="tag.id"
          @click="toggleLine(tag.id)"
        >
          <div>
            <div
              style="margin-top: 6px; margin-right: 5px"
              v-html="tag.legendSvg"
            ></div>
          </div>
          {{ tag.name }}
        </v-chip>
      </v-chip-group>
      <v-btn
        v-show="requiresExpand"
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="plain"
        @click="toggleExpand"
      ></v-btn>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  AlertLines,
  CartesianAxesOptions,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartMarker,
  ChartRule,
  TooltipAnchor,
  TooltipOptions,
  WheelMode,
  ZoomHandler,
  toggleChartVisibility,
} from '@deltares/fews-web-oc-charts'
import {
  AxisPosition,
  AxisType,
  CartesianAxes,
  CurrentTime,
  MouseOver,
} from '@deltares/fews-web-oc-charts'
import LoadingOverlay from '@/components/charts/LoadingOverlay.vue'
import type { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import type { ChartSeries } from '../../lib/charts/types/ChartSeries.js'
import type { ThresholdLine } from '../../lib/charts/types/ThresholdLine.js'
import { Series } from '../../lib/timeseries/timeSeries.js'
import {
  dataFromResources,
  removeUnreliableData,
} from '@/lib/charts/dataFromResources'
import uniq from 'lodash-es/uniq'
import { extent } from 'd3'
import { VChipGroup } from 'vuetify/components'
import { difference, merge } from 'lodash-es'

const LEGEND_HEIGHT = 76

interface Props {
  config?: ChartConfig
  series?: Record<string, Series>
  currentTime?: Date
  isLoading?: boolean
}

interface Tag {
  id: string
  name: string
  disabled: boolean
  legendSvg: string
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
const legendTags = ref<Tag[]>([])
const chartContainer = ref<HTMLElement>()
const chipGroup = ref<VChipGroup>()
const expanded = ref(false)
const requiresExpand = ref(false)
const axisTime = ref<CurrentTime>()

const margin = {
  top: 110,
  right: 50,
  left: 50,
}

onMounted(() => {
  const axisOptions: CartesianAxesOptions = {
    x: [
      {
        type: AxisType.time,
        position: AxisPosition.Bottom,
        showGrid: true,
      },
    ],
    y: [
      {
        position: AxisPosition.Left,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true,
      },
      {
        position: AxisPosition.Right,
        label: ' ',
        unit: ' ',
        nice: true,
      },
    ],
    margin,
  }

  if (chartContainer.value) {
    axis = new CartesianAxes(
      chartContainer.value,
      null,
      null,
      merge(axisOptions, { x: props.config?.xAxis, y: props.config?.yAxis }),
    )
    const mouseOver = new MouseOver()
    const zoom = new ZoomHandler(WheelMode.NONE)
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
    if (props.config !== undefined) refreshChart()
    window.addEventListener('resize', resize)
  }
})

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

  const tag = legendTags.value.find((tag) => {
    return tag.id === 'Thresholds'
  })

  const disabled = tag?.disabled ?? false
  if (disabled) {
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

const toggleLine = (id: string) => {
  const tag = legendTags.value.find((tag) => {
    return tag.id === id
  })
  if (tag) {
    tag.disabled = !tag.disabled
  }

  if (id === 'Thresholds') {
    setThresholdLines()
    axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
  } else {
    toggleChartVisibility(axis, id)
  }
}

const resize = () => {
  nextTick(() => {
    axis.resize()
    setLegendSize()
  })
}

function setLegendSize() {
  const contentHeight = chipGroup.value?.$el.scrollHeight
  if (contentHeight && contentHeight > LEGEND_HEIGHT) {
    requiresExpand.value = true
  } else {
    requiresExpand.value = false
  }
}

function toggleExpand() {
  expanded.value = !expanded.value
}

const onValueChange = () => {
  clearChart()
  refreshChart()
  setTags()
  setLegendSize()
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

.chart-controls {
  position: absolute;
  display: flex;
  flex: 0;
  margin: 5px 10px;
  padding: 0px 0px 0px 40px;
  overflow: hidden;
}

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
  max-height: none;
}

.chart-legend {
  overflow-y: hidden;
  align-self: end;
}

.chart-legend.chart-legend--large {
  align-self: start;
}

.chart-with-chips {
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1 1 80%;
  height: 100%;
}

.v-chip--outlined {
  opacity: 0.5;
}
</style>
