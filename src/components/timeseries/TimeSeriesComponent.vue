<template>
  <div class="panel">
    <div class="panel-scroll">
      <v-window v-model="tab">
        <v-window-item :value="DisplayType.TimeSeriesChart">
          <KeepAlive>
            <TimeSeriesChart
              v-for="(subplot, i) in subplots"
              :config="subplot"
              :series="series"
              :key="`${subplot.title}-${i}`"
              class="single"
            >
            </TimeSeriesChart>
          </KeepAlive>
        </v-window-item>
        <v-window-item :value="DisplayType.TimeSeriesTable">
          <KeepAlive>
            <TimeSeriesTable
              :config="tableConfig"
              :series="series"
              :key="tableConfig.title"
              class="single"
            >
            </TimeSeriesTable>
          </KeepAlive>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TimeSeriesChart from '../charts/TimeSeriesChart.vue'
import TimeSeriesTable from '../table/TimeSeriesTable.vue'
import {
  DisplayType,
  type DisplayConfig,
} from '../../lib/display/DisplayConfig.js'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { useTimeSeries } from '../../services/useTimeSeries/index.ts'
import { configManager } from '../../services/application-config'

interface Props {
  config?: DisplayConfig
  displayType: DisplayType
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      id: '',
      displayType: DisplayType.TimeSeriesChart,
      class: '',
      requests: [],
      subplots: [],
    }
  },
  displayType: DisplayType.TimeSeriesChart,
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series } = useTimeSeries(baseUrl, () => props.config.requests)

const subplots = computed(() => {
  if (props.config) {
    return props.config.subplots
  } else {
    return []
  }
})

const tableConfig = ref<ChartConfig>({ title: '', series: [] })

watch(
  () => props.config.subplots,
  (newSubplots) => {
    const series = newSubplots
      .flatMap((subplot) => subplot.series)
      .filter((series) => series.visibleInTable)
    tableConfig.value = {
      title: props.config.title,
      series,
    }
  },
)

const tab = ref<DisplayType>(props.displayType)

watch(
  () => props.displayType,
  () => {
    tab.value = props.displayType
  },
)
</script>

<style>
.panel {
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

.panel-scroll {
  display: flex;
  position: relative;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.single {
  width: 100%;
  flex: 1 1 50%;
  min-height: 400px;
}

.double {
  width: 100%;
  flex: 1 1 50%;
  min-height: 500px;
}

.panel-chart-container {
  display: block;
  height: 400px;
  width: 100%;
}
</style>
