<template>
  <TimeSeriesWindowComponent
    :displayConfig="displayConfig"
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
            @click="selectedPlotId = display.id"
            :title="display.id"
            :active="selectedPlotId === display.id"
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
import {
  useDisplayConfig,
  type UseDisplayConfigOptions,
} from '@/services/useDisplayConfig/index.ts'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useSystemTimeStore } from '@/stores/systemTime'
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
const systemTimeStore = useSystemTimeStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlotId = ref<string>()

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const nodeId = computed(() =>
  Array.isArray(props.nodeId)
    ? props.nodeId[props.nodeId.length - 1]
    : props.nodeId,
)
const { displays, displayConfig } = useDisplayConfig(
  baseUrl,
  nodeId,
  selectedPlotId,
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
  options,
)

watchEffect(() => {
  if (props.plotId) selectedPlotId.value = props.plotId
})

watch(displays, () => {
  const plotIds = displays.value?.map((d) => d.id) ?? []
  if (
    selectedPlotId.value === undefined ||
    !plotIds.includes(selectedPlotId.value)
  ) {
    selectedPlotId.value = plotIds[0]
  }
})
</script>
