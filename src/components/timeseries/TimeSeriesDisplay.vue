<template>
  <TimeSeriesWindowComponent
    :displayConfig="displayConfig"
    :settings="settings.charts"
  >
    <template #toolbar-title>
      <v-btn-group variant="text" tile v-if="displays && displays.length > 1">
        <v-btn
          min-width="40px"
          :disabled="selectedPlotIndex === 0"
          @click="prevDisplay"
          ><v-icon>mdi-chevron-left</v-icon></v-btn
        >
        <v-btn
          min-width="40px"
          :disabled="selectedPlotIndex === displays.length - 1"
          @click="nextDisplay"
          ><v-icon>mdi-chevron-right</v-icon></v-btn
        >
        <v-btn
          v-bind="props"
          variant="text"
          class="text-start"
          min-width="150px"
          append-icon="mdi-chevron-down"
        >
          <v-list-item class="ps-0 pe-0" :title="displayConfig?.title">
          </v-list-item>
          <v-menu activator="parent">
            <v-list density="compact">
              <v-list-item
                v-for="(display, index) in displays"
                :key="display.plotId"
                :title="display.id"
                :active="selectedPlotIndex === index"
                @click="selectedPlotIndex = index"
              >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
      </v-btn-group>
    </template>
  </TimeSeriesWindowComponent>
</template>

<script setup lang="ts">
import TimeSeriesWindowComponent from './TimeSeriesWindowComponent.vue'
import { ref, computed, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import {
  useDisplayConfig,
  type UseDisplayConfigOptions,
} from '@/services/useDisplayConfig/index.ts'
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

const selectedPlotIndex = ref<number>()

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
  selectedPlotIndex,
  options,
  () => taskRunsStore.selectedTaskRunIds,
)

function prevDisplay() {
  if (!displays.value || displays.value.length === 0) return
  if (selectedPlotIndex.value !== undefined && selectedPlotIndex.value > 0) {
    selectedPlotIndex.value -= 1
  }
}

function nextDisplay() {
  if (!displays.value || displays.value.length === 0) return
  if (
    selectedPlotIndex.value !== undefined &&
    selectedPlotIndex.value < displays.value.length - 1
  ) {
    selectedPlotIndex.value += 1
  }
}

watchEffect(() => {
  if (displays.value) {
    const plotIndex = displays.value.findIndex((d) => d.plotId === props.plotId)
    if (plotIndex >= 0) {
      selectedPlotIndex.value = plotIndex
    } else {
      selectedPlotIndex.value = 0
    }
  } else {
    selectedPlotIndex.value = 0
  }
})
</script>
