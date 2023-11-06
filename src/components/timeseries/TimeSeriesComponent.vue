<template>
  <v-window v-model="tab" class="h-100 w-100">
    <v-window-item
      :value="DisplayType.TimeSeriesChart"
      class="d-flex flex-column overflow-y-auto flex-1-1-100 h-100"
    >
      <KeepAlive>
        <TimeSeriesChart
          v-for="(subplot, i) in subplots"
          :config="subplot"
          :series="series"
          :key="`${subplot.title}-${i}`"
        >
        </TimeSeriesChart>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      :value="DisplayType.TimeSeriesTable"
      class="component-container max-height"
    >
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
import type { UseTimeSeriesOptions } from '../../services/useTimeSeries/index.ts'
import { configManager } from '../../services/application-config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useSystemTimeStore } from '@/stores/systemTime'

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

const settings = useUserSettingsStore()
const store = useSystemTimeStore()

const options = computed<UseTimeSeriesOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
    startTime: store.startTime,
    endTime: store.endTime,
  }
})
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series } = useTimeSeries(baseUrl, () => props.config.requests, options)

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

<style scoped>
.component-container {
  display: flex;
  flex: 1 1 100%;
  width: 100%;
  flex-direction: column;
}

.scroll {
  overflow-y: auto;
}

.max-height {
  height: 100%;
}
</style>
