<template>
  <HisCollectionChart :collection :chart :subplot :series :settings />
</template>

<script setup lang="ts">
import HisCollectionChart from './HisCollectionChart.vue'
import type { Collection, Chart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'

interface Props {
  collection: Collection
  chart: Chart
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const { subplot, series } = useCorrelationChartData(
  () => props.chart,
  () => props.series,
  () => props.startTime,
  () => props.endTime,
)
</script>
