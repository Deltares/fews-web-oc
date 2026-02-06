<template>
  <div class="d-flex flex-column w-100 h-100">
    <div class="d-flex flex-1-1-100 h-100">
      <TimeSeriesWindowComponent
        :displayConfig="displayConfig"
        :elevationChartDisplayconfig="elevationChartDisplayconfig"
        :currentTime="currentTime"
        :filter="filter"
        :settings="settings.charts"
        :informationContent="tooltip"
      >
        <template #toolbar-append>
          <v-btn size="small" icon @click="onClose">
            <v-icon>mdi-close</v-icon>
          </v-btn>
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
  filterActionsFilter,
  LocationsTooltipFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { useLocationTooltip } from '@/services/useLocationTooltip'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useTaskRunsStore } from '@/stores/taskRuns'

interface Props {
  filter?: filterActionsFilter | timeSeriesGridActionsFilter
  elevationChartFilter?: timeSeriesGridActionsFilter
  locationsTooltipFilter?: LocationsTooltipFilter
  currentTime?: Date
  settings: ComponentSettings
}

const taskRunsStore = useTaskRunsStore()

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => props.filter)
const { displayConfig, scalar1DDisplayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => taskRunsStore.selectedTaskRunIds,
)
const { displayConfig: elevationChartDisplayconfigFromGrid } =
  useDisplayConfigFilter(
    baseUrl,
    () => props.elevationChartFilter ?? {},
    () => taskRunsStore.selectedTaskRunIds,
  )

const elevationChartDisplayconfig = computed(
  () =>
    scalar1DDisplayConfig?.value ?? elevationChartDisplayconfigFromGrid.value,
)

const { tooltip } = useLocationTooltip(
  baseUrl,
  () => props.locationsTooltipFilter,
)

function onClose(): void {
  emit('close')
}
</script>
