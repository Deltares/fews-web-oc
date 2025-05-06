<template>
  <v-card flat density="compact" color="transparent">
    <v-card-title class="d-flex align-center">
      <div>{{ chart.title }}</div>
      <v-spacer />
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-horizontal"
            variant="text"
            density="compact"
            v-bind="props"
          />
        </template>
        <v-list density="compact">
          <v-list-item
            title="Edit"
            prepend-icon="mdi-pencil"
            density="compact"
            @click="() => {}"
          />
          <v-list-item
            title="Remove"
            prepend-icon="mdi-delete"
            density="compact"
            @click="removeChart(chart)"
          />
        </v-list>
      </v-menu>
    </v-card-title>
    <TimeSeriesChart
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
    />
  </v-card>
</template>

<script setup lang="ts">
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { Collection, Chart } from '@/lib/his'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed } from 'vue'

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

const domain = computed<[Date, Date] | undefined>(() => {
  return props.chart.type === 'filter'
    ? [props.startTime, props.endTime]
    : undefined
})

const config = computed(() =>
  timeSeriesDisplayToChartConfig(props.chart.subplot, domain.value),
)

function removeChart(chart: Chart) {
  props.collection.charts.splice(
    props.collection.charts.findIndex((c) => c === chart),
    1,
  )
}
</script>
