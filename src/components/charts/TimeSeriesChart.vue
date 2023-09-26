<template>
  <div class="chart-with-chips">
    <div class="chart-controls">
      <v-chip-group column>
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
    </div>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  AlertLines,
  CartesianAxesOptions,
  ChartLine,
  ChartMarker,
  WheelMode,
  toggleChartVisisbility,
} from '@deltares/fews-web-oc-charts'
import {
  AxisPosition,
  AxisType,
  CartesianAxes,
  CurrentTime,
  MouseOver,
  ZoomHandler,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import type { ChartSeries } from '../../lib/charts/types/ChartSeries.js'
import type { ThresholdLine } from '../../lib/charts/types/ThresholdLine.js'
import { Series } from '../../lib/timeseries/timeSeries.js'
import uniq from 'lodash-es/uniq'
import { extent } from 'd3'

interface Props {
  config?: ChartConfig
  series?: Record<string, Series>
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
    }
  },
  series: () => {
    return {}
  },
})

let thresholdLines!: ThresholdLine[]
let thresholdLinesVisitor!: AlertLines
let axis!: CartesianAxes
const legendTags = ref<Tag[]>([])
const chartContainer = ref<HTMLElement>()

onMounted(() => {
  console.log('onMounted', props.config)
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
    margin: {
      left: 80,
      right: 80,
    },
  }

  console.log(chartContainer)
  if (chartContainer.value) {
    axis = new CartesianAxes(chartContainer.value, null, null, axisOptions)
    const mouseOver = new MouseOver()
    const zoom = new ZoomHandler(WheelMode.X)
    const currentTime = new CurrentTime({
      x: {
        axisIndex: 0,
      },
    })

    thresholdLinesVisitor = new AlertLines(thresholdLines)

    axis.accept(thresholdLinesVisitor)
    axis.accept(zoom)
    axis.accept(mouseOver)
    axis.accept(currentTime)
    resize()
    if (props.config !== undefined) refreshChart()
    window.addEventListener('resize', resize)
  }
})

const addToChart = (chartSeries: ChartSeries) => {
  const id = chartSeries.id
  const seriesData = props.series[chartSeries.dataResources[0]]
  const data = seriesData?.data !== undefined ? seriesData.data : []
  let line
  if (chartSeries.type === 'line') {
    line = new ChartLine(data, {
      tooltip: {
        toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`,
      },
    })
  } else {
    line = new ChartMarker(data, {
      symbol: chartSeries.marker,
      tooltip: {
        toolTipFormatter: () => `${chartSeries.name} ${chartSeries.unit}`,
      },
    })
  }
  line.addTo(
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
  if (thresholdLinesData === undefined) return

  const tag = legendTags.value.find((tag) => {
    return tag.id === 'Thresholds'
  })

  const disabled = tag?.disabled ?? false
  if (disabled) {
    thresholdLines = []
  } else {
    thresholdLines = thresholdLinesData
  }

  let defaultDomain = extent(thresholdLinesData.map((l) => l.value))
  if (thresholdLines.length === 0 || defaultDomain[0] === undefined) {
    defaultDomain = [NaN, NaN]
  }

  axis.setOptions({
    y: [{ defaultDomain: defaultDomain, nice: true }],
  })
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
  if (props.config.yAxis) {
    axis.setOptions({
      y: [props.config.yAxis[0], props.config.yAxis[1]],
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
  if (thresholdsData !== undefined) {
    const { svgGroup, legendSvg } = createChip()
    legendSvg.appendChild(svgGroup)
    const thresholdLegend = {
      id: 'Thresholds',
      name: 'Thresholds',
      disabled: false,
      legendSvg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21Z"/></svg>',
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
    toggleChartVisisbility(axis, id)
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

watch(props.series, onValueChange, { deep: true })
watch(props.config, onValueChange)

onBeforeUnmount(() => {
  beforeDestroy()
})
</script>

<style scoped>
.chart-container {
  display: flex;
  position: relative;
  flex: 1 1 100px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

.chart-controls {
  display: flex;
  flex: 0;
  margin: 0 50px;
}

.chart-container.hidden > svg {
  display: none;
}

.chart-container.fullscreen {
  max-height: none;
}

.chart-with-chips {
  display: flex;
  flex-direction: column;
  flex: 1 1 80%;
  height: 100%;
}

.v-chip--outlined {
  opacity: 0.5;
}
</style>
