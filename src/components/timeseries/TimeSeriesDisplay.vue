<template>
  <TimeSeriesWindowComponent
    :displayConfig="displayConfig"
    :settings="settings.charts"
  >
    <template #toolbar-title>
      <v-menu v-if="plotIds.length > 1" offset-y z-index="10000">
        <template v-slot:activator="{ props }">
          <v-btn class="text-capitalize" variant="text" v-bind="props"
            >{{ plotIds[selectedPlot] }}<v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list v-model="selectedPlot" density="compact">
          <v-list-item
            v-for="(plot, i) in plotIds"
            v-bind:key="i"
            @click="selectedPlot = i"
          >
            <v-list-item-title>{{ plot }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </TimeSeriesWindowComponent>
</template>

<script setup lang="ts">
import TimeSeriesWindowComponent from './TimeSeriesWindowComponent.vue'
import { ref, watch, computed } from 'vue'
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
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()
const systemTimeStore = useSystemTimeStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlot = ref(0)

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const { displays, displayConfig } = useDisplayConfig(
  baseUrl,
  () => {
    if (typeof props.nodeId === 'string') {
      return props.nodeId
    } else {
      return props.nodeId[props.nodeId.length - 1]
    }
  },
  selectedPlot,
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
  options,
)

const plotIds = computed(() => {
  if (displays.value && displays.value.length > 0) {
    return displays.value.map((d) => {
      return d.title
    })
  }
  return []
})

watch(props, () => (selectedPlot.value = 0))
</script>
