<template>
  <div ref="brushContainer" class="brush-container"></div>
</template>

<script setup lang="ts">
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import { BrushHandler, CartesianAxes } from '@deltares/fews-web-oc-charts'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import type { Margin } from '@deltares/fews-web-oc-charts'
import { getAxisOptions } from '@/lib/charts/axisOptions'
import { clearChart, redraw, refreshChart } from '@/lib/charts/timeSeriesChart'
import { useSeriesUpdateChartData } from '@/services/useSeriesUpdateChartData'
import { getSubplotWithDomain } from '@/lib/display'
import { useI18n } from 'vue-i18n'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesChart']
  fullDomain: [Date, Date]
  mainChartMargin?: Margin
}

const props = defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')

const brushContainer = useTemplateRef('brushContainer')

const { locale } = useI18n()

let axis!: CartesianAxes
let brushHandler!: BrushHandler

const chartConfig = computed(() =>
  getSubplotWithDomain(props.config, props.fullDomain),
)

onMounted(() => {
  if (!brushContainer.value) throw new Error('No brush container found')

  const axisOptions = getAxisOptions(chartConfig.value, props.settings, {
    isBrush: true,
    locale: locale.value,
  })
  axis = new CartesianAxes(brushContainer.value, null, null, axisOptions)

  brushHandler = new BrushHandler({
    domain: { x: domain.value },
    labelFormatter: () => '',
  })
  axis.accept(brushHandler)

  brushHandler.addEventListener('update:x-brush-domain', (e) => {
    domain.value = e.new as [Date, Date]
  })

  onValueChange(chartConfig.value)
})

useSeriesUpdateChartData(
  () => props.series,
  chartConfig,
  () => axis,
)

function onValueChange(config: ChartConfig) {
  clearChart(axis)
  refreshChart(axis, config, props.series)
  redraw(axis, config)
}
watch(chartConfig, (newConfig) => onValueChange(newConfig))

watch(domain, (newDomain) => {
  brushHandler.setBrushDomain({ x: newDomain })
})

// Keep margin in sync with main chart
watch(
  () => props.mainChartMargin,
  (newMargin) => {
    if (!axis || !newMargin) return
    if (newMargin.left !== undefined) axis.margin.left = newMargin.left
    if (newMargin.right !== undefined) axis.margin.right = newMargin.right
    nextTick(() => axis.resize())
  },
  { deep: true },
)
</script>

<style scoped>
.brush-container {
  display: flex;
  position: relative;
  flex: 1 1 65px;
  max-height: 65px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}

:deep(.brush .selection) {
  stroke: none;
}
</style>
