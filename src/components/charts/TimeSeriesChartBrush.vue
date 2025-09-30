<template>
  <div ref="brushContainer" class="brush-container"></div>
</template>

<script setup lang="ts">
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import { BrushHandler, CartesianAxes } from '@deltares/fews-web-oc-charts'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import { onMounted, useTemplateRef, watch } from 'vue'
import { getAxisOptions } from '@/lib/charts/axisOptions'
import { clearChart, redraw, refreshChart } from '@/lib/charts/timeSeriesChart'
import { toHumanReadableDate } from '@/lib/date'
import { useSeriesUpdateChartData } from '@/services/useSeriesUpdateChartData'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesChart']
}

const props = defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')

const brushContainer = useTemplateRef('brushContainer')

let axis!: CartesianAxes
let brushHandler!: BrushHandler

onMounted(() => {
  if (!brushContainer.value) throw new Error('No brush container found')

  const axisOptions = getAxisOptions(props.config, props.settings, {
    isBrush: true,
  })
  axis = new CartesianAxes(brushContainer.value, null, null, axisOptions)

  brushHandler = new BrushHandler({
    domain: { x: domain.value },
    labelFormatter: toHumanReadableDate,
  })
  axis.accept(brushHandler)

  brushHandler.addEventListener('update:x-brush-domain', (e) => {
    domain.value = e.new as [Date, Date]
  })

  onValueChange()
})

useSeriesUpdateChartData(
  () => props.series,
  () => props.config,
  () => axis,
)

function onValueChange() {
  clearChart(axis)
  refreshChart(axis, props.config, props.series)
  redraw(axis, props.config)
}
watch(() => props.config, onValueChange)

watch(domain, (newDomain) => {
  brushHandler.setBrushDomain({ x: newDomain })
})
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
</style>
