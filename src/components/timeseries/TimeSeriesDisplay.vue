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
        @after-enter="focusSelectedDisplay"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            append-icon="mdi-chevron-down"
            :text="displayConfig?.title"
          />
        </template>
        <output
          v-if="displayIndexBuffer || displaySearchBuffer"
          class="plot-selection-input"
          aria-label="Plot selection input"
        >
          {{ displayIndexBuffer || displaySearchBuffer }}
        </output>
        <v-list ref="displayList" v-model="selectedPlotId" density="compact">
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
import { ref, watch, computed, useTemplateRef } from 'vue'
import type { NavigateRoute } from '@/lib/router'
import type { VList } from 'vuetify/components'
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

const emit = defineEmits<{
  navigate: [to: NavigateRoute]
}>()

const userSettings = useUserSettingsStore()
const taskRunsStore = useTaskRunsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlotId = ref(props.plotId)
const displayList = useTemplateRef<VList>('displayList')
const isDisplayMenuOpen = ref(false)
const displaySearchBuffer = ref('')
const displayIndexBuffer = ref('')

const DISPLAY_SEARCH_DELAY_MS = 220
const DISPLAY_INDEX_DELAY_MS = 450
const DISPLAY_BUFFER_RESET_MS = 1200

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

const currentNodeDisplays = computed(() =>
  displays.value?.every((display) => display.nodeId === nodeId.value)
    ? displays.value
    : null,
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

watch([() => props.plotId, nodeId], ([plotId]) => {
  if (plotId !== selectedPlotId.value) resetSelectionInput()
  const availableDisplays = currentNodeDisplays.value
  selectedPlotId.value = availableDisplays?.length
    ? (availableDisplays.find((display) => display.plotId === plotId)?.plotId ??
      availableDisplays[0]?.plotId)
    : plotId
})

watch([selectedPlotId, () => props.plotId], ([plotId]) => {
  if (!currentNodeDisplays.value) return
  if (plotId === undefined || props.plotId === plotId) return

  emit('navigate', {
    name: 'TimeSeriesDisplay',
    params: { plotId },
  })
})

watch(displays, () => {
  resetSelectionInput()
  const availableDisplays = currentNodeDisplays.value
  if (!availableDisplays) return
  const plotIds = availableDisplays.map((d) => d.plotId)
  if (
    selectedPlotId.value === undefined ||
    !plotIds.includes(selectedPlotId.value)
  ) {
    selectedPlotId.value = plotIds[0]
  }
})

watch(nodeId, resetSelectionInput)

const focusSelectedDisplay = () => {
  if (!isDisplayMenuOpen.value) return

  const list = displayList.value?.$el as HTMLElement | undefined
  const selectedItem = list?.querySelector<HTMLElement>('.v-list-item--active')
  selectedItem?.focus({ preventScroll: true })
  selectedItem?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

watch([selectedPlotId, isDisplayMenuOpen, displayList], focusSelectedDisplay, {
  flush: 'post',
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

function clearSearchTimers() {
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

function resetSelectionInput() {
  clearSearchTimers()
  displaySearchBuffer.value = ''
  displayIndexBuffer.value = ''
}

const scheduleSearch = () => {
  if (searchApplyTimer) clearTimeout(searchApplyTimer)
  if (searchResetTimer) clearTimeout(searchResetTimer)

  searchApplyTimer = setTimeout(() => {
    applyDisplaySearch()
  }, DISPLAY_SEARCH_DELAY_MS)

  searchResetTimer = setTimeout(() => {
    displaySearchBuffer.value = ''
  }, DISPLAY_BUFFER_RESET_MS)
}

const scheduleIndexSelection = () => {
  if (indexApplyTimer) clearTimeout(indexApplyTimer)
  if (indexResetTimer) clearTimeout(indexResetTimer)

  const prefix = displayIndexBuffer.value
  const hasLongerIndex = displays.value?.some((_, index) => {
    const displayIndex = String(index + 1)
    return (
      displayIndex.length > prefix.length && displayIndex.startsWith(prefix)
    )
  })

  if (hasLongerIndex) {
    indexApplyTimer = setTimeout(() => {
      applyDisplayIndexSelection()
    }, DISPLAY_INDEX_DELAY_MS)
  } else {
    indexApplyTimer = undefined
    applyDisplayIndexSelection()
  }

  indexResetTimer = setTimeout(() => {
    displayIndexBuffer.value = ''
  }, DISPLAY_BUFFER_RESET_MS)
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
    resetSelectionInput()
    return
  }

  window.addEventListener('keydown', onMenuKeydown)
  onCleanup(() => {
    window.removeEventListener('keydown', onMenuKeydown)
    clearSearchTimers()
  })
})
</script>

<style scoped>
.plot-selection-input {
  display: block;
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  z-index: 1;
  width: max-content;
  min-width: 3ch;
  max-width: min(12rem, 100%);
  padding: 2px 6px;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  text-align: right;
  pointer-events: none;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
