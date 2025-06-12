<template>
  <AnalysisFilterChart :chart :subplot :series :settings v-bind="$attrs" />
</template>

<script setup lang="ts">
import AnalysisFilterChart from './AnalysisFilterChart.vue'
import type { CorrelationChart } from '@/lib/analysis'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'

interface Props {
  chart: CorrelationChart
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const { subplot, series } = useCorrelationChartData(
  () => props.chart,
  () => props.startTime,
  () => props.endTime,
)
</script>
