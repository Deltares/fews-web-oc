<template>
  <div class="chart-with-chips">
    <LoadingOverlay v-if="isLoading" :offsets="margin" height="90%" />
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
  CartesianAxesOptions,
  ChartLine,
  WheelMode,
  toggleChartVisibility,
} from '@deltares/fews-web-oc-charts'
import {
  AxisPosition,
  AxisType,
  CartesianAxes,
  VerticalMouseOver,
  ZoomHandler,
} from '@deltares/fews-web-oc-charts'
import LoadingOverlay from '@/components/charts/LoadingOverlay.vue'
import type { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import type { ChartSeries } from '../../lib/charts/types/ChartSeries.js'
import { Series } from '../../lib/timeseries/timeSeries.js'
import uniq from 'lodash-es/uniq'
import { VChipGroup } from 'vuetify/components'
import { difference } from 'lodash-es'
import {
  dataFromResources,
  removeUnreliableData,
} from '@/lib/charts/dataFromResources'

const LEGEND_HEIGHT = 76

interface Props {
  config?: ChartConfig
  series?: Record<string, Series>
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
})

let axis!: CartesianAxes
const legendTags = ref<Tag[]>([])
const chartContainer = ref<HTMLElement>()
const chipGroup = ref<VChipGroup>()
const expanded = ref(false)
const requiresExpand = ref(false)

const margin = {
  top: 110,
  left: 70,
  right: 30,
  bottom: 50,
}

onMounted(() => {
  const axisOptions: CartesianAxesOptions = {
    x: [
      {
        type: AxisType.value,
        position: AxisPosition.Bottom,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true,
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
    ],
    margin,
  }

  const chartWidth = 800
  const chartHeight = 1200

  setChartConfigValues(axisOptions)

  if (chartContainer.value) {
    axis = new CartesianAxes(
      chartContainer.value,
      chartWidth,
      chartHeight,
      axisOptions,
    )
    const mouseOver = new VerticalMouseOver()
    const zoom = new ZoomHandler(WheelMode.NONE)

    axis.accept(zoom)
    axis.accept(mouseOver)
    resize()
    if (props.config !== undefined) {
      refreshChart()
      setTags()
    }
    window.addEventListener('resize', resize)
  }
})

const setChartConfigValues = (axisOptions: CartesianAxesOptions) => {
  props.config.yAxis?.forEach((axis, i) => {
    axisOptions.y[i].type = axis.type
  })

  props.config.xAxis?.forEach((axis, i) => {
    axisOptions.x[i].type = axis.type
  })
}

const addToChart = (chartSeries: ChartSeries) => {
  const id = chartSeries.id

  const rawData = dataFromResources(chartSeries.dataResources, props.series)
  const data = removeUnreliableData(rawData)

  const line = new ChartLine(data, {
    tooltip: {
      toolTipFormatter: () => {
        const tooltip = document.createElement('div')
        tooltip.innerText = `${chartSeries.name} ${chartSeries.unit}`
        return tooltip
      },
    },
  })

  line.addTo(
    axis,
    {
      x: {
        key: 'x',
        axisIndex: chartSeries.options.x.axisIndex,
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
  if (props.config.xAxis) {
    axis.setOptions({
      x: [props.config.xAxis[0], props.config.xAxis[1]],
    })
  }

  axis.redraw({
    x: {
      nice: false
        ? props.config?.xAxis?.some((c) => c.defaultDomain)
        : undefined,
      autoScale: true,
    },
    y: {
      nice: false
        ? props.config?.yAxis?.some((c) => c.defaultDomain)
        : undefined,
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

  toggleChartVisibility(axis, id)
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
