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
        v-model="isDisplayMenuOpen"
        location="bottom"
        z-index="10000"
        max-height="400"
        :close-on-content-click="false"
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
            :key="display.plotId"
            @click="selectedPlotId = display.plotId"
            :active="selectedPlotId === display.plotId"
          >
            <template #title>
              <HighlightMatch :value="display.id" :query="displaySearchBuffer" />
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </TimeSeriesWindowComponent>
</template>

<script setup lang="ts">
import TimeSeriesWindowComponent from './TimeSeriesWindowComponent.vue'
import HighlightMatch from '@/components/general/HighlightMatch.vue'
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
const isDisplayMenuOpen = ref(false)
const displaySearchBuffer = ref('')

let searchApplyTimer: ReturnType<typeof setTimeout> | undefined
let searchResetTimer: ReturnType<typeof setTimeout> | undefined

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

const findDisplayBySearch = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return

  const availableDisplays = displays.value ?? []
  return (
    availableDisplays.find((display) =>
      display.id.toLowerCase().startsWith(normalizedQuery),
    ) ??
    availableDisplays.find((display) =>
      display.id.toLowerCase().includes(normalizedQuery),
    )
  )
}

const applyDisplaySearch = () => {
  const match = findDisplayBySearch(displaySearchBuffer.value)
  if (match) {
    selectedPlotId.value = match.plotId
  }
}

const clearSearchTimers = () => {
  if (searchApplyTimer) {
    clearTimeout(searchApplyTimer)
    searchApplyTimer = undefined
  }
  if (searchResetTimer) {
    clearTimeout(searchResetTimer)
    searchResetTimer = undefined
  }
}

const scheduleSearch = () => {
  if (searchApplyTimer) clearTimeout(searchApplyTimer)
  if (searchResetTimer) clearTimeout(searchResetTimer)

  searchApplyTimer = setTimeout(() => {
    applyDisplaySearch()
  }, 220)

  searchResetTimer = setTimeout(() => {
    displaySearchBuffer.value = ''
  }, 1200)
}

const onMenuKeydown = (event: KeyboardEvent) => {
  if (!isDisplayMenuOpen.value) return
  if (event.ctrlKey || event.metaKey || event.altKey) return

  const target = event.target as HTMLElement | null
  if (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable
  ) {
    return
  }

  if (event.key === 'Backspace') {
    displaySearchBuffer.value = displaySearchBuffer.value.slice(0, -1)
    scheduleSearch()
    return
  }

  if (event.key.length !== 1) return

  displaySearchBuffer.value += event.key
  scheduleSearch()
}

watch(isDisplayMenuOpen, (isOpen, _, onCleanup) => {
  if (!isOpen) {
    clearSearchTimers()
    displaySearchBuffer.value = ''
    return
  }

  window.addEventListener('keydown', onMenuKeydown)
  onCleanup(() => {
    window.removeEventListener('keydown', onMenuKeydown)
    clearSearchTimers()
  })
})
</script>
