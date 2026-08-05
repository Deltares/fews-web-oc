<template>
  <div class="d-flex w-100 h-100 flex-row">
    <div class="h-100 d-flex flex-column child-container">
      <div class="w-100 d-flex flex-1-1 overflow-x-auto overflow-y-auto">
        <div v-if="microFrontEndError" class="microfrontend-error-container">
          <v-alert
            type="error"
            density="compact"
            variant="tonal"
            class="microfrontend-error"
          >
            {{ microFrontEndError }}
          </v-alert>
        </div>
        <component
          v-else-if="loaded"
          :is="PluginComponent"
          :selectedDate="selectedDateOfSlider"
          :topologyNode="topologyNode"
          :hostSettings="hostSettings"
          :settings="settings"
          @navigate="onNavigate"
        />
      </div>
      <DateTimeSlider
        class="w-100"
        v-if="dateTimeSliderEnabled && times?.length"
        v-model:selectedDate="selectedDateOfSlider"
        :dates="times"
      />
    </div>
    <div v-if="showChartPanel" class="child-container">
      <SpatialTimeSeriesDisplay
        :current-time="selectedDateOfSlider"
        :settings="settings"
        :locationIds="locationIds"
        :topologyNode="topologyNode"
      >
        <template #toolbar-append>
          <v-btn
            size="small"
            icon="mdi-close"
            @click="closeTimeSeriesDisplay"
          />
        </template>
      </SpatialTimeSeriesDisplay>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  ref,
  shallowRef,
  watchEffect,
} from 'vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import type { NavigateRoute } from '@/lib/router'
import { type TopologyNode } from '@deltares/fews-pi-requests'

import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { useMicroFrontEnd } from '@/composables/useMicroFrontEnd'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { configManager } from '@/services/application-config'

export interface HostSettings {
  baseUrl: string
  webservicesUrl: string
  getHeaders: () => Promise<Headers>
}

const SpatialTimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialTimeSeriesDisplay.vue'),
)

const loaded = ref(false)
const PluginComponent = shallowRef<any>(null)
const microFrontEndError = ref<string | null>(null)

const { loadWebOCRemote } = useMicroFrontEnd()

interface Props {
  locationIds?: string
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const {
  locationIds,
  topologyNode,
  settings = getDefaultSettings(),
} = defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()

const hostSettings = computed<HostSettings>(() => ({
  baseUrl: import.meta.env.BASE_URL,
  webservicesUrl: configManager.get('VITE_FEWS_WEBSERVICES_URL'),
  getHeaders: () => authenticationManager.getAuthorizationHeaders(),
}))

watchEffect(async () => {
  loaded.value = false
  microFrontEndError.value = null

  const microFrontEndId = topologyNode?.microFrontEnds?.map((mf) => mf.id)[0]
  if (!microFrontEndId) {
    PluginComponent.value = null
    loaded.value = true
    return
  }

  try {
    PluginComponent.value = await loadWebOCRemote(microFrontEndId)
  } catch (error) {
    PluginComponent.value = null
    microFrontEndError.value =
      error instanceof Error
        ? error.message
        : `Failed to load Micro Frontend '${microFrontEndId}'.`
  }

  loaded.value = true
})

const dateTimeSliderEnabled = ref<boolean>(false)
const times = ref<Date[]>([])

const showChartPanel = computed(() => {
  return locationIds
})

const selectedDateOfSlider = ref<Date>(times.value[0])

function onNavigate(event: any) {
  emit('navigate', event)
}

function closeTimeSeriesDisplay(): void {
  emit('navigate', { name: 'MicroFrontendDisplay' })
}
</script>

<style scoped>
.child-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 50%;
  max-width: 100%;
  flex: 1 1 0px;
}

.microfrontend-error-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.microfrontend-error {
  flex: 0 0 auto;
  width: auto;
  max-width: min(640px, 100%);
}
</style>
