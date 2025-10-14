<template>
  <v-window v-model="tab" class="h-100 w-100" :touch="false">
    <v-window-item
      v-if="settings.timeSeriesChart.enabled"
      :value="DisplayType.TimeSeriesChart"
      class="time-series-component__container scroll"
    >
      <KeepAlive>
        <template v-for="subplot in subplots" :key="subplot.id">
          <TimeSeriesChart
            v-model:domain="visibleDomain"
            :config="subplot"
            :series="chartSeries"
            :highlightTime="selectedDate"
            :zoomHandler="sharedZoomHandler"
            :panHandler="sharedPanHandler"
            :settings="settings.timeSeriesChart"
            :forecastLegend="config.forecastLegend"
          >
            <TimeSeriesChartBrush
              v-model:domain="visibleDomain"
              :config="getSubplotWithDomain(subplot, fullBrushDomain)"
              :series="brushChartSeries"
              :settings="settings.timeSeriesChart"
            />
          </TimeSeriesChart>
        </template>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      v-if="settings.verticalProfileChart.enabled"
      :value="DisplayType.ElevationChart"
      class="elevation-chart-component__container scroll"
    >
      <KeepAlive>
        <TimeSeriesChart
          v-for="subplot in elevationChartSubplots"
          verticalProfile
          :config="subplot"
          :series="elevationChartSeries"
          :key="subplot.id"
          :style="`min-width: ${xs ? 100 : 50}%`"
          :zoomHandler="sharedVerticalZoomHandler"
          :settings="settings.verticalProfileChart"
        >
        </TimeSeriesChart>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      v-if="settings.timeSeriesTable.enabled"
      :value="DisplayType.TimeSeriesTable"
      class="time-series-component__container max-height"
    >
      <TimeSeriesTable
        :config="tableConfig"
        :series="tableSeries"
        :key="tableConfig.title"
        :settings="settings.timeSeriesTable"
        :is-loading="isLoadingTableSeries"
        class="single"
        @change="(event) => onDataChange(event)"
        @update:isEditing="isEditing = $event"
      >
      </TimeSeriesTable>
    </v-window-item>
    <v-window-item
      v-if="settings.metaDataPanel.enabled"
      :value="DisplayType.Information"
      class="h-100"
    >
      <div v-html="informationContent" class="pa-4 h-100 w-100" />
    </v-window-item>
  </v-window>
  <v-dialog v-model="confirmationDialog" persistent max-width="500">
    <v-card prepend-icon="mdi-content-save" title="Unsaved Changes">
      <v-card-text>
        You have unsaved changes. Are you sure you want to leave?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn varint="flat" @click="onConfirmationCancel"> Cancel </v-btn>
        <v-btn color="error" variant="flat" @click="onConfirmationLeave">
          Leave
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import TimeSeriesChart from '../charts/TimeSeriesChart.vue'
import TimeSeriesChartBrush from '../charts/TimeSeriesChartBrush.vue'
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
import { onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'
import { until } from '@vueuse/core'
import { useSelectedDate } from '@/services/useSelectedDate'
import {
  getDefaultSettings,
  type ChartsSettings,
} from '@/lib/topology/componentSettings'
import { useChartHandlers } from '@/services/useChartHandlers'
import { useFetchDomain } from '@/services/useFetchDomain/index.ts'
import {
  getDomainWithConfigFallback,
  getSubplotWithDomain,
} from '@/lib/display/utils'

interface Props {
  config?: DisplayConfig
  elevationChartConfig?: DisplayConfig
  displayType: DisplayType
  currentTime?: Date
  informationContent?: string | null
  settings?: ChartsSettings
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      id: '',
      nodeId: '',
      plotId: '',
      index: 0,
      displayType: DisplayType.TimeSeriesChart,
      class: '',
      requests: [],
      subplots: [],
      period: undefined,
      forecastLegend: undefined,
    }
  },
  elevationChartConfig: () => {
    return {
      title: '',
      id: '',
      nodeId: '',
      plotId: '',
      index: 0,
      displayType: DisplayType.ElevationChart,
      class: '',
      requests: [],
      subplots: [],
      period: undefined,
      forecastLegend: undefined,
    }
  },
  settings: () => getDefaultSettings().charts,
})

const { selectedDate } = useSelectedDate(() => props.currentTime)
const store = useSystemTimeStore()
const isEditing = ref(false)
const confirmationDialog = ref(false)
const { xs } = useDisplay()
const { sharedZoomHandler, sharedPanHandler, sharedVerticalZoomHandler } =
  useChartHandlers()

const tab = ref<DisplayType>(props.displayType)

const visibleDomain = ref<[Date, Date]>()
const fullDomain = computed(() =>
  getDomainWithConfigFallback(store.startTime, store.endTime, props.config),
)
const fullBrushDomain = ref<[Date, Date]>([
  new Date('2024-05-01T00:00:00Z'),
  new Date('2025-12-31T23:59:59Z'),
])
const chartOptions = ref<UseTimeSeriesOptions>({
  startTime: store.startTime,
  endTime: store.endTime,
  thinning: true,
})
const brushOptions = ref<UseTimeSeriesOptions>({
  startTime: fullBrushDomain.value[0],
  endTime: fullBrushDomain.value[1],
  thinning: true,
})
const tableOptions = computed<UseTimeSeriesOptions>(() => ({
  startTime: store.startTime,
  endTime: store.endTime,
  thinning: false,
}))

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series: chartSeries, interval: useTimeSeriesInterval } = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  chartOptions,
  () => tab.value === DisplayType.TimeSeriesChart,
)
const { series: brushChartSeries } = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  brushOptions,
  () => tab.value === DisplayType.TimeSeriesChart,
)
const {
  series: tableSeries,
  isLoading: isLoadingTableSeries,
  refresh: refreshTableTimeSeries,
} = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  tableOptions,
  () => tab.value === DisplayType.TimeSeriesTable,
)
const { series: elevationChartSeries } = useTimeSeries(
  baseUrl,
  () => props.elevationChartConfig.requests,
  chartOptions,
  () => tab.value === DisplayType.ElevationChart,
  selectedDate,
)

async function onDataChange(newData: Record<string, TimeSeriesEvent[]>) {
  const seriesKey = props.config.requests[0]?.key
  const seriesHeader = seriesKey
    ? chartSeries.value[seriesKey].header
    : undefined
  await postTimeSeriesEdit(
    baseUrl,
    props.config.requests,
    newData,
    seriesHeader?.version ?? '',
    seriesHeader?.timeZone ?? '',
  )
  refreshTableTimeSeries()
}

const subplots = computed(() =>
  props.config.subplots.map((subplot) =>
    getSubplotWithDomain(subplot, fullDomain.value),
  ),
)

const elevationChartSubplots = computed(() => {
  if (props.elevationChartConfig) {
    return props.elevationChartConfig.subplots
  } else {
    return []
  }
})

const tableConfig = ref<ChartConfig>({ id: '', title: '', series: [] })

watch(
  () => props.config.subplots,
  (newSubplots) => {
    const series = newSubplots
      .flatMap((subplot) => subplot.series)
      .filter((series) => series.visibleInTable)

    series.forEach((s) => {
      s.editable = props.config.requests.some(
        (request) => request.key === s.id && request.editRequest,
      )
    })

    tableConfig.value = {
      id: 'table',
      title: props.config.title,
      series,
    }
  },
)

watch(
  () => props.displayType,
  () => {
    tab.value = props.displayType
  },
)

watch(isEditing, () => {
  if (isEditing.value) {
    useTimeSeriesInterval?.pause()
  } else {
    useTimeSeriesInterval?.resume()
  }
  // Can't set a custom message in modern browsers
  window.onbeforeunload = isEditing.value ? () => true : null
})

onUnmounted(() => {
  window.onbeforeunload = null
})

onBeforeRouteLeave(confirmUnsavedChanges)
onBeforeRouteUpdate(confirmUnsavedChanges)
async function confirmUnsavedChanges() {
  if (isEditing.value) {
    // For multiple simultaneous leaves set to false since confirm dialog is async
    isEditing.value = false

    confirmationDialog.value = true
    await until(confirmationDialog).toBe(false)

    if (isEditing.value) {
      return false
    }
  }
}

function onConfirmationCancel() {
  confirmationDialog.value = false
  isEditing.value = true
}

function onConfirmationLeave() {
  confirmationDialog.value = false
  isEditing.value = false
}

const { debouncedRefetchChartTimeSeries } = useFetchDomain(chartOptions)

watch(visibleDomain, (newDomain) => {
  if (!newDomain) return
  debouncedRefetchChartTimeSeries(newDomain)
})
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
