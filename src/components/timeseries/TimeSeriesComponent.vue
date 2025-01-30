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
          :currentTime="selectedDate"
          :isLoading="isLoading(subplot, loadingSeriesIds)"
          :zoomHandler="sharedZoomHandler"
        >
        </TimeSeriesChart>
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
          :isLoading="isLoading(subplot, elevationLoadingSeriesIds)"
          :zoomHandler="sharedVerticalZoomHandler"
        >
        </ElevationChart>
      </KeepAlive>
    </v-window-item>
    <v-window-item
      :value="DisplayType.TimeSeriesTable"
      class="time-series-component__container max-height"
    >
      <TimeSeriesTable
        :config="tableConfig"
        :series="series"
        :key="tableConfig.title"
        class="single"
        @change="(event) => onDataChange(event)"
        @update:isEditing="isEditing = $event"
      >
      </TimeSeriesTable>
    </v-window-item>
    <v-window-item :value="DisplayType.Information" class="h-100">
      <!-- <div class="px-4 h-100"> -->
      <!--   <iframe :srcdoc="informationContent" class="h-100 w-100 border-none" /> -->
      <!-- </div> -->
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
import { onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'
import { until } from '@vueuse/core'
import { ZoomHandler, ZoomMode } from '@deltares/fews-web-oc-charts'
import { getUniqueSeries } from '@/lib/charts/getUniqueSeriesIds.ts'
import { useDateRegistry } from '@/services/useDateRegistry'
import { useSelectedDate } from '@/services/useSelectedDate'

interface Props {
  config?: DisplayConfig
  elevationChartConfig?: DisplayConfig
  displayType: DisplayType
  currentTime?: Date
  informationContent?: string
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
      period: undefined,
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
      period: undefined,
    }
  },
  displayType: DisplayType.TimeSeriesChart,
})

const { selectedDate } = useSelectedDate(() => props.currentTime ?? new Date())
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

const options = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
    thinning: false,
  }
})
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series, loadingSeriesIds } = useTimeSeries(
  baseUrl,
  () => props.config.requests,
  lastUpdated,
  options,
)
const {
  series: elevationChartSeries,
  loadingSeriesIds: elevationLoadingSeriesIds,
} = useTimeSeries(
  baseUrl,
  () => props.elevationChartConfig.requests,
  lastUpdated,
  options,
  selectedDate,
)

const dates = computed(() => {
  const chartSeries = props.config.subplots.flatMap((s) => s.series)
  const seriesDates = getUniqueSeries(chartSeries)
    .map((chartSeries) => chartSeries.dataResources[0])
    .map((resource) => series.value[resource])
    .flatMap((series) => series?.data ?? [])
    .flatMap((data) => (data.x as Date) ?? [])

  return seriesDates
})
useDateRegistry(dates)

function isLoading(subplot: ChartConfig, loadingSeriesIds: string[]) {
  return subplot.series
    .map((s) => s.id)
    .some((id) => {
      const idWithoutIndex = id.replace(/\[\d+\]$/, '')
      return loadingSeriesIds.includes(idWithoutIndex)
    })
}

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

    series.forEach((s) => {
      s.editable = props.config.requests.some(
        (request) => request.key === s.id && request.editRequest,
      )
    })

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

watch(isEditing, () => {
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
