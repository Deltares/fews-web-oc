<template>
  <AnalysisPlotChart
    :chart
    :config
    :series
    :settings
    :zoomHandler
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import AnalysisPlotChart from '@/components/analysis/AnalysisPlotChart.vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { FilterChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed } from 'vue'
import { getSubplotWithDomain } from '@/lib/display'

interface Props {
  chart: FilterChart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  domain?: [Date, Date]
}

const props = defineProps<Props>()

const domain = computed(() => props.chart.domain ?? props.domain)

const zoomHandler = computed(() =>
  props.chart.domain ? undefined : props.zoomHandler,
)

const config = computed(() =>
  getSubplotWithDomain(
    timeSeriesDisplayToChartConfig(props.chart.subplot),
    domain.value,
  ),
)
</script>
