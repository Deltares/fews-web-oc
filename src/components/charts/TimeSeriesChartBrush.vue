<template>
  <div ref="brushContainer" class="brush-container"></div>
</template>

<script setup lang="ts">
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import {
  BrushHandler,
  CartesianAxes,
  CartesianAxesOptions,
} from '@deltares/fews-web-oc-charts'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import { getAxisOptions } from '@/lib/charts/axisOptions'
import { difference, merge } from 'lodash-es'
import {
  clearChart,
  redraw,
  refreshChart,
  updateChartData,
} from '@/lib/charts/timeSeriesChart'
import { toHumanReadableDate } from '@/lib/date'

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

  const axisOptions = getAxisOptions(props.config, props.settings, false)
  const brushOptions: Partial<CartesianAxesOptions> = {
    margin: { top: 5 },
    x: [
      {
        showAxis: false,
        showGrid: false,
      },
    ],
    y: [
      { showAxis: false, showGrid: false, label: '', unit: '' },
      { showAxis: false, showGrid: false, label: '', unit: '' },
    ],
  }

  const opts = merge({}, axisOptions, brushOptions)

  axis = new CartesianAxes(brushContainer.value, null, null, opts)

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

const hasRenderedOnce = ref(false)
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
      updateChartData(axis, requiredSeries, props.series)

      if (!hasRenderedOnce.value) {
        redraw(axis, props.config)
        hasRenderedOnce.value = true
      }
    }
  },
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
  flex: 1 1 80px;
  max-height: 80px;
  width: 100%;
  fill: currentColor;
  margin: 0px auto;
  overflow: hidden;
}
</style>
