<template>
  <TimeSeriesWindowComponent
    :displayConfig="displayConfig"
    :elevationChartDisplayconfig="scalar1DDisplayConfig"
    :brushChartConfig="brushChartConfig"
    :settings="settings.charts"
  >
    <template #toolbar-title>
      <v-menu
        v-if="displays && displays.length > 1"
        location="bottom"
        z-index="10000"
        max-height="400"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            class="text-capitalize"
            variant="text"
            append-icon="mdi-chevron-down"
            :text="displayConfig?.title"
          />
        </template>
        <v-list v-model="selectedPlotId" density="compact">
          <v-list-item
            v-for="display in displays"
            @click="selectedPlotId = display.plotId"
            :title="display.id"
            :active="selectedPlotId === display.plotId"
          />
        </v-list>
      </v-menu>
    </template>
  </TimeSeriesWindowComponent>
</template>

<script setup lang="ts">
import TimeSeriesWindowComponent from './TimeSeriesWindowComponent.vue'
import { ref, watch, computed, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { useDisplayConfig } from '@/services/useDisplayConfig/index.ts'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useTaskRunsStore } from '@/stores/taskRuns'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'

interface Props {
  nodeId?: string | string[]
  plotId?: string
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()
const taskRunsStore = useTaskRunsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlotId = ref<string>()

const nodeId = computed(() =>
  Array.isArray(props.nodeId)
    ? props.nodeId[props.nodeId.length - 1]
    : props.nodeId,
)

const filter = computed(() => {
  if (!nodeId.value) {
    return
  }
  return {
    nodeId: nodeId.value,
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const { displays, displayConfig, scalar1DDisplayConfig } = useDisplayConfig(
  baseUrl,
  filter,
  selectedPlotId,
  () => taskRunsStore.selectedTaskRunIds,
)

const brushFilter = computed(() => {
  if (!userSettings.get('charts.brush')?.value || !nodeId.value) {
    return
  }
  return {
    nodeId: nodeId.value,
    fullDataPeriod: true,
  }
})

const { displayConfig: brushChartConfig } = useDisplayConfig(
  baseUrl,
  brushFilter,
  selectedPlotId,
  () => taskRunsStore.selectedTaskRunIds,
)

watchEffect(() => {
  if (props.plotId) selectedPlotId.value = props.plotId
})

watch(displays, () => {
  const plotIds = displays.value?.map((d) => d.plotId) ?? []
  if (
    selectedPlotId.value === undefined ||
    !plotIds.includes(selectedPlotId.value)
  ) {
    selectedPlotId.value = plotIds[0]
  }
})
</script>
