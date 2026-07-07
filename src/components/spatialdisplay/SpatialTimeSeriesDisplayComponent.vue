<template>
  <div class="d-flex flex-column w-100 h-100">
    <div class="d-flex flex-1-1-100 h-100">
      <TimeSeriesWindowComponent
        :displayConfig="displayConfig"
        :elevationChartDisplayconfig="elevationChartDisplayconfig"
        :brushChartConfig="brushChartConfig"
        :disable-thinning="disableThinning"
        :currentTime="currentTime"
        :filter="filter"
        :settings="settings.charts"
        :informationContent="tooltip"
      >
        <template #toolbar-append>
          <slot name="toolbar-append" />
        </template>
      </TimeSeriesWindowComponent>
    </div>
  </div>
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import TimeSeriesWindowComponent from '@/components/timeseries/TimeSeriesWindowComponent.vue'
import { useDisplayConfigFilter } from '@/services/useDisplayConfig'
import type {
  FilterActionsFilter,
  LocationsTooltipFilter,
  TimeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed, onMounted, onUnmounted } from 'vue'
import { useLocationTooltip } from '@/services/useLocationTooltip'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useTaskRunsStore } from '@/stores/taskRuns'

interface Props {
  brushFilter?: FilterActionsFilter | TimeSeriesGridActionsFilter
  disableThinning?: boolean
  filter?: FilterActionsFilter | TimeSeriesGridActionsFilter
  elevationChartFilter?: TimeSeriesGridActionsFilter
  locationsTooltipFilter?: LocationsTooltipFilter
  currentTime?: Date
  settings: ComponentSettings
  hideFullscreenButton?: boolean
}

const taskRunsStore = useTaskRunsStore()

const props = defineProps<Props>()

const DISPLAY_CONFIG_POLLING_INTERVAL = 60_000

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => props.filter)
const {
  displayConfig,
  scalar1DDisplayConfig,
  startPolling: startMainDisplayPolling,
  stopPolling: stopMainDisplayPolling,
} = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => taskRunsStore.selectedTaskRunIds,
)
const {
  displayConfig: elevationChartDisplayconfigFromGrid,
  startPolling: startElevationDisplayPolling,
  stopPolling: stopElevationDisplayPolling,
} = useDisplayConfigFilter(
  baseUrl,
  () => props.elevationChartFilter ?? {},
  () => taskRunsStore.selectedTaskRunIds,
)

const elevationChartDisplayconfig = computed(
  () =>
    scalar1DDisplayConfig?.value ?? elevationChartDisplayconfigFromGrid.value,
)

const {
  displayConfig: brushChartConfig,
  startPolling: startBrushDisplayPolling,
  stopPolling: stopBrushDisplayPolling,
} = useDisplayConfigFilter(
  baseUrl,
  () => props.brushFilter ?? {},
  () => taskRunsStore.selectedTaskRunIds,
)

const { tooltip } = useLocationTooltip(
  baseUrl,
  () => props.locationsTooltipFilter,
)

onMounted(() => {
  startMainDisplayPolling(DISPLAY_CONFIG_POLLING_INTERVAL)
  startElevationDisplayPolling(DISPLAY_CONFIG_POLLING_INTERVAL)
  startBrushDisplayPolling(DISPLAY_CONFIG_POLLING_INTERVAL)
})

onUnmounted(() => {
  stopMainDisplayPolling()
  stopElevationDisplayPolling()
  stopBrushDisplayPolling()
})
</script>
