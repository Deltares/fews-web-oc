<template>
  <v-window v-model="tab" class="h-100 w-100" :touch="false">
    <v-window-item
      :value="DisplayType.TimeSeriesChart"
      class="time-series-component__container scroll"
    >
      <KeepAlive>
        <TimeSeriesChart
          v-for="(subplot, i) in subplots"
          :config="subplot"
          :series="series"
          :key="`${subplot.title}-${i}`"
          :currentTime="props.currentTime"
        >
        </TimeSeriesChart>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      :value="DisplayType.TimeSeriesTable"
      class="time-series-component__container max-height"
    >
      <KeepAlive>
        <TimeSeriesTable
          :config="tableConfig"
          :series="series"
          :key="tableConfig.title"
          class="single"
          @change="(event) => onDataChange(event)"
        >
        </TimeSeriesTable>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      :value="DisplayType.ElevationChart"
      class="elevation-chart-component__container scroll"
    >
      <KeepAlive>
        <ElevationChart
          v-for="(subplot, i) in elevationChartSubplots"
          :config="subplot"
          :series="elevationChartSeries"
          :key="`${subplot.title}-${i}`"
          :style="`min-width: ${xs ? 100 : 50}%`"
        >
        </ElevationChart>
      </KeepAlive>
    </v-window-item>
  </v-window>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TimeSeriesChart from '../charts/TimeSeriesChart.vue'
import ElevationChart from '../charts/ElevationChart.vue'
import TimeSeriesTable from '../table/TimeSeriesTable.vue'
import {
  DisplayType,
  type DisplayConfig,
} from '../../lib/display/DisplayConfig.js'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import {
  postTimeSeriesEdit,
  useTimeSeries,
} from '../../services/useTimeSeries/index.ts'
import type { UseTimeSeriesOptions } from '../../services/useTimeSeries/index.ts'
import { configManager } from '../../services/application-config'
import { useSystemTimeStore } from '@/stores/systemTime'
import type { TimeSeriesEvent } from '@deltares/fews-pi-requests'
import { useDisplay } from 'vuetify'

interface Props {
  config?: DisplayConfig
  elevationChartConfig?: DisplayConfig
  displayType: DisplayType
  currentTime?: Date
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      id: '',
      nodeId: '',
      index: 0,
      displayType: DisplayType.TimeSeriesChart,
      class: '',
      requests: [],
      subplots: [],
    }
  },
  elevationChartConfig: () => {
    return {
      title: '',
      id: '',
      nodeId: '',
      index: 0,
      displayType: DisplayType.ElevationChart,
      class: '',
      requests: [],
      subplots: [],
    }
  },
  displayType: DisplayType.TimeSeriesChart,
})

const store = useSystemTimeStore()
const lastUpdated = ref<Date>(new Date())
const { xs } = useDisplay()

const options = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series } = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  lastUpdated,
  options,
)
const { series: elevationChartSeries } = useTimeSeries(
  baseUrl,
  () => props.elevationChartConfig.requests,
  lastUpdated,
  options,
  () => props.currentTime,
)

async function onDataChange(newData: Record<string, TimeSeriesEvent[]>) {
  await postTimeSeriesEdit(baseUrl, props.config.requests, newData)
  lastUpdated.value = new Date()
}

const subplots = computed(() => {
  if (props.config) {
    return props.config.subplots
  } else {
    return []
  }
})

const elevationChartSubplots = computed(() => {
  if (props.elevationChartConfig) {
    return props.elevationChartConfig.subplots
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

<style scoped>
.time-series-component__container {
  display: flex;
  flex: 1 1 100%;
  width: 100%;
  flex-direction: column;
}

.elevation-chart-component__container {
  display: flex;
  flex: 1 1 100%;
  flex-direction: row;
  overflow-x: auto;
}

.scroll {
  overflow-y: auto;
}

.max-height {
  height: 100%;
}
</style>
