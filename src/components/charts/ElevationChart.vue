<template>
  <div class="chart-with-chips">
    <ChartLegend
      v-if="settings.legend.show"
      :tags="legendTags"
      :margin="margin"
      :settings="settings.legend"
      @toggleLine="toggleLine"
    />
    <LoadingOverlay v-if="isLoading" :offsets="margin" />
    <div ref="chartContainer" class="chart-container" v-show="!isLoading"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
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
import ChartLegend from '@/components/charts/ChartLegend.vue'
import type { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import type { ChartSeries } from '../../lib/charts/types/ChartSeries.js'
import { Series } from '../../lib/timeseries/timeSeries.js'
import uniq from 'lodash-es/uniq'
import { difference, merge } from 'lodash-es'
import {
  dataFromResources,
  removeUnreliableData,
} from '@/lib/charts/dataFromResources'
import { type ChartSettings } from '@/lib/topology/componentSettings/chartSettings.js'
import type { Tag } from '@/lib/charts/tags'

interface Props {
  config?: ChartConfig
  series?: Record<string, Series>
  isLoading?: boolean
  zoomHandler?: ZoomHandler
  settings: ChartSettings['verticalProfileChart']
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

const defaultMargin = {
  top: 40,
  left: 70,
  right: 30,
  bottom: 40,
}

const defaultOptions: CartesianAxesOptions = {
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
  margin: defaultMargin,
}

const axisOptions = computed(() => {
  const configOptions: Partial<CartesianAxesOptions> = {
    x: props.config?.xAxis,
    y: props.config?.yAxis,
  }

  return merge(defaultOptions, configOptions)
})

const margin = computed(() => {
  return axisOptions.value.margin ?? {}
})

onMounted(() => {
  const chartWidth = 800
  const chartHeight = 1200

  if (chartContainer.value) {
    axis = new CartesianAxes(
      chartContainer.value,
      chartWidth,
      chartHeight,
      axisOptions.value,
    )
    const mouseOver = new VerticalMouseOver()
    const zoom = props.zoomHandler ?? new ZoomHandler(WheelMode.NONE)

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

const toggleLine = (tag: Tag) => {
  toggleChartVisibility(axis, tag.id)
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
  height: 100%;
  max-width: 600px;
}
</style>
