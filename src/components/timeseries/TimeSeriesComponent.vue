<template>
  <v-window v-model="tab" class="h-100 w-100" :touch="false">
    <v-window-item
      v-if="settings.timeSeriesChart.enabled"
      :value="DisplayType.TimeSeriesChart"
      class="time-series-component__container scroll"
    >
      <KeepAlive>
        <TimeSeriesChart
          v-for="subplot in subplots"
          :config="subplot"
          :series="chartSeries"
          :key="subplot.id"
          :highlightTime="selectedDate"
          :isLoading="isLoading(subplot, loadingSeriesIds)"
          :zoomHandler="sharedZoomHandler"
          :settings="settings.timeSeriesChart"
          :forecastLegend="config.forecastLegend"
          @update:x-domain="refetchChartTimeSeries"
        >
        </TimeSeriesChart>
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
          :isLoading="isLoading(subplot, elevationLoadingSeriesIds)"
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
import { ZoomHandler, ZoomMode } from '@deltares/fews-web-oc-charts'
import { useSelectedDate } from '@/services/useSelectedDate'
import {
  getDefaultSettings,
  type ChartsSettings,
} from '@/lib/topology/componentSettings'

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

// Ratio between old and new domain when zooming above which no refetch is
// performed. Note: zooming out (i.e. zoom ratio > 1) will always refetch.
const MAX_ZOOM_RATIO_FOR_REFETCH = 0.8

const { selectedDate } = useSelectedDate(() => props.currentTime)
const store = useSystemTimeStore()
const lastUpdated = ref<Date>(new Date())
const isEditing = ref(false)
const confirmationDialog = ref(false)
const { xs } = useDisplay()
const sharedZoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.X,
})
const sharedVerticalZoomHandler = new ZoomHandler({
  sharedZoomMode: ZoomMode.Y,
})

const chartOptions = ref<UseTimeSeriesOptions>({
  startTime: store.startTime,
  endTime: store.endTime,
  thinning: true,
})
const tableOptions = computed<UseTimeSeriesOptions>(() => ({
  ...chartOptions.value,
  thinning: false,
}))

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const {
  series: chartSeries,
  loadingSeriesIds,
  interval: useTimeSeriesInterval,
} = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  lastUpdated,
  chartOptions,
)
const { series: tableSeries } = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  lastUpdated,
  tableOptions,
)
const {
  series: elevationChartSeries,
  loadingSeriesIds: elevationLoadingSeriesIds,
} = useTimeSeries(
  baseUrl,
  () => props.elevationChartConfig.requests,
  lastUpdated,
  chartOptions,
  selectedDate,
)

function isLoading(subplot: ChartConfig, loadingSeriesIds: string[]) {
  return subplot.series
    .map((s) => s.id)
    .some((id) => {
      const idWithoutIndex = id.replace(/\[\d+\]$/, '')
      return loadingSeriesIds.includes(idWithoutIndex)
    })
}

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

const tab = ref<DisplayType>(props.displayType)

watch(
  () => props.displayType,
  () => {
    tab.value = props.displayType
  },
)

watch(isEditing, () => {
  if (isEditing.value) {
    useTimeSeriesInterval.pause()
  } else {
    useTimeSeriesInterval.resume()
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

function refetchChartTimeSeries(
  oldDomain: [Date, Date],
  newDomain: [Date, Date],
) {
  const getRange = (domain: [Date, Date]) =>
    domain[1].getTime() - domain[0].getTime()
  const zoomRatio = getRange(newDomain) / getRange(oldDomain)

  // When zooming out, always refresh the data; we need more data than we had
  // before.
  // When zooming in, only fetch new data when zooming in more than a threshold,
  // to prevent small changes in domain from updating all the data due to a
  // slightly changed thinning parameter.
  const isZoomingOut = zoomRatio > 1
  const isZoomingInEnough = zoomRatio < MAX_ZOOM_RATIO_FOR_REFETCH
  if (isZoomingOut || isZoomingInEnough) {
    // Request a time series update with the new domain by setting a new
    // lastUpdated value.
    const [startTime, endTime] = newDomain
    chartOptions.value = { ...chartOptions.value, startTime, endTime }
    lastUpdated.value = new Date()
  }
}
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
