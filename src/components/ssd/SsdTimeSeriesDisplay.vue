<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
      <TimeSeriesWindowComponent
        :displayConfig="displayConfig"
        :settings="chartSettings"
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
import { computed, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { useSsdPi } from '@/services/useSsdPi/index.ts'
import TimeSeriesWindowComponent from '@/components/timeseries/TimeSeriesWindowComponent.vue'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  type ChartSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'

interface Props {
  panelId?: string
  objectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  panelId: '',
  objectId: '',
})

// TODO: Get this from component settings endpoint
const chartSettings = computed<ChartSettings>(() => {
  return getDefaultSettings('charts')
})

const emit = defineEmits<{ (e: 'close', objectId: string): void }>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const settings = useUserSettingsStore()

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
})

const { displayConfig } = useSsdPi(
  baseUrl,
  () => props.panelId,
  () => props.objectId,
  options,
)

watch(
  () => displayConfig,
  () => {
    if (!displayConfig.value) return

    if (displayConfig.value.subplots.length < 1) {
      onClose()
    }
  },
  { deep: true },
)

function onClose(): void {
  emit('close', props.objectId)
}
</script>
