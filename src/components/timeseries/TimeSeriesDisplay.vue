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
            variant="text"
            append-icon="mdi-chevron-down"
            :text="displayConfig?.title"
          />
        </template>
        <v-list v-model="selectedPlotId" density="compact">
          <v-list-item
            v-for="(display, index) in displays"
            :key="display.plotId"
            @click="selectedPlotId = display.plotId"
            :active="selectedPlotId === display.plotId"
          >
            <template #title>
              <div class="d-flex align-center justify-space-between ga-3">
                <HighlightMatch
                  :value="display.id"
                  :query="displaySearchBuffer"
                />
                <kbd>{{ index + 1 }}</kbd>
              </div>
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
const displayIndexBuffer = ref('')

let searchApplyTimer: ReturnType<typeof setTimeout> | undefined
let searchResetTimer: ReturnType<typeof setTimeout> | undefined
let indexApplyTimer: ReturnType<typeof setTimeout> | undefined
let indexResetTimer: ReturnType<typeof setTimeout> | undefined

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

const applyDisplayIndexSelection = () => {
  const index = Number.parseInt(displayIndexBuffer.value, 10) - 1
  if (Number.isNaN(index) || index < 0) return

  const display = displays.value?.[index]
  if (display) {
    selectedPlotId.value = display.plotId
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
  if (indexApplyTimer) {
    clearTimeout(indexApplyTimer)
    indexApplyTimer = undefined
  }
  if (indexResetTimer) {
    clearTimeout(indexResetTimer)
    indexResetTimer = undefined
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

const scheduleIndexSelection = () => {
  if (indexApplyTimer) clearTimeout(indexApplyTimer)
  if (indexResetTimer) clearTimeout(indexResetTimer)

  indexApplyTimer = setTimeout(() => {
    applyDisplayIndexSelection()
  }, 220)

  indexResetTimer = setTimeout(() => {
    displayIndexBuffer.value = ''
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
    if (displayIndexBuffer.value) {
      displayIndexBuffer.value = displayIndexBuffer.value.slice(0, -1)
      scheduleIndexSelection()
      return
    }

    displaySearchBuffer.value = displaySearchBuffer.value.slice(0, -1)
    scheduleSearch()
    return
  }

  if (event.key >= '0' && event.key <= '9') {
    displayIndexBuffer.value += event.key
    scheduleIndexSelection()
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
    displayIndexBuffer.value = ''
    return
  }

  window.addEventListener('keydown', onMenuKeydown)
  onCleanup(() => {
    window.removeEventListener('keydown', onMenuKeydown)
    clearSearchTimers()
  })
})
</script>
