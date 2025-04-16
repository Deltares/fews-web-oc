<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
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
import { useSystemTimeStore } from '@/stores/systemTime'
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

const systemTimeStore = useSystemTimeStore()
const taskRunsStore = useTaskRunsStore()

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => props.filter)
const { displayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
  () => taskRunsStore.selectedTaskRunIds
)
const { displayConfig: elevationChartDisplayconfig } = useDisplayConfigFilter(
  baseUrl,
  () => props.elevationChartFilter ?? {},
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
)

const { tooltip } = useLocationTooltip(
  baseUrl,
  () => props.locationsTooltipFilter,
)

function onClose(): void {
  emit('close')
}
</script>
