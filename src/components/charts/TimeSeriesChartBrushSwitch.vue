<template>
  <!-- Reserve space before the async v5 brush component loads. -->
  <div v-if="engine === 'v5'" class="brush-chart-placeholder">
    <TimeSeriesChartBrushV5
      v-model:domain="domain"
      :config
      :series
      :settings
      :full-domain="fullDomain"
      :group
    />
  </div>
  <TimeSeriesChartBrushV4
    v-else
    v-model:domain="domain"
    :config
    :series
    :settings
    :full-domain="fullDomain"
    :main-chart-margin="mainChartMargin"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type {
  ChartGroup,
  ChartMargin,
} from '@/lib/charts/types/TimeSeriesChartProps'
import { useUserSettingsStore } from '@/stores/userSettings'
import TimeSeriesChartBrushV4 from './TimeSeriesChartBrush.vue'

interface Props {
  config: ChartConfig
  series: Record<string, Series>
  settings: ChartsSettings['timeSeriesChart']
  fullDomain: [Date, Date]
  mainChartMargin?: ChartMargin
  group?: ChartGroup
}

defineProps<Props>()
const domain = defineModel<[Date, Date]>('domain')
const userSettings = useUserSettingsStore()
const engine = computed(() => userSettings.chartEngine)
const TimeSeriesChartBrushV5 = defineAsyncComponent(
  () => import('./v5/TimeSeriesChartBrushV5.vue'),
)
</script>

<style scoped>
.brush-chart-placeholder {
  height: 60px;
  flex: 0 0 60px;
  width: 100%;
}
</style>
