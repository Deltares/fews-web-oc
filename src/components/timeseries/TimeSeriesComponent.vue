<template>
  <v-window v-model="tab" class="h-100 w-100" :touch="() => false">
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
import {
  postTimeSeriesEdit,
  useTimeSeries,
} from '../../services/useTimeSeries/index.ts'
import type { UseTimeSeriesOptions } from '../../services/useTimeSeries/index.ts'
import { configManager } from '../../services/application-config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useSystemTimeStore } from '@/stores/systemTime'
import type { TimeSeriesEvent } from '@deltares/fews-pi-requests'

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
const lastUpdated = ref<Date>(new Date())

const options = computed<UseTimeSeriesOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
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

.scroll {
  overflow-y: auto;
}

.max-height {
  height: 100%;
}
</style>
