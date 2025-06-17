<template>
  <div class="d-flex h-100 w-100 overflow-hidden">
    <v-navigation-drawer
      v-model="drawer"
      permanent
      :mobile="false"
      width="500"
      class="his-selection"
    >
      <div v-show="tab === 'data-selection'" class="h-100">
        <AnalysisDataSelection
          :charts="selectedCollection.charts"
          :filters="config.filters"
          :boundingBox="boundingBox"
          :config="config.selectionPanel"
          @addChart="addChart"
        />
      </div>
      <div v-show="tab === 'analysis'" class="h-100">
        <AnalysisFunctions
          :charts="selectedCollection.charts"
          :series="series"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          :config="config"
          :settings="settings"
          @addChart="addChart"
        />
      </div>
      <div v-show="tab === 'workflows'">
        <AnalysisWorkflows :config="config" @addChart="addChart" />
      </div>
      <div v-show="tab === 'settings'">
        <AnalysisSettings
          :collection="selectedCollection"
          @delete-collection="deleteSelectedCollection"
        />
      </div>
    </v-navigation-drawer>
    <div class="flex-0-0">
      <v-toolbar-items class="flex-column mt-2 border-e border-t border-b">
        <v-btn
          v-for="tab in tabs"
          :key="tab.value"
          :icon="tab.icon"
          @click="toggleTab(tab.value)"
          height="40"
          :active="isActive(tab.value)"
          :disabled="tab.disabled"
          v-tooltip="tab.text"
        />
      </v-toolbar-items>
    </div>
    <div class="d-flex flex-column flex-1-1 overflow-auto">
      <v-card-title class="flex-0-0 d-flex ga-2 align-center">
        <AnalysisCollection
          v-model:selectedCollection="selectedCollection"
          v-model:collections="collections"
          :config="config"
        />
      </v-card-title>
      <div class="w-100 overflow-y-auto">
        <AnalysisCollectionCharts
          v-if="selectedCollection.charts.length"
          v-model:collection="selectedCollection"
          :series="series"
          :settings="settings"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          class="flex-1-1"
          @addChart="addChart"
        />
        <v-card-text v-else> Select some data to display </v-card-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnalysisDataSelection from '@/components/analysis/AnalysisDataSelection.vue'
import AnalysisCollectionCharts from './AnalysisCollectionCharts.vue'
import AnalysisCollection from '@/components/analysis/AnalysisCollection.vue'
import AnalysisFunctions from '@/components/analysis/functions/AnalysisFunctions.vue'
import AnalysisWorkflows from '@/components/analysis/workflows/AnalysisWorkflows.vue'
import AnalysisSettings from '@/components/analysis/AnalysisSettings.vue'
import type {
  ActionRequest,
  BoundingBox,
  DataAnalysisDisplayElement,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { useTimeSeries } from '@/services/useTimeSeries'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import {
  type Chart,
  type Collection,
  getDateTimeSerializer,
  createCollection,
  hasValidFilterCharts,
} from '@/lib/analysis'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useStorage } from '@vueuse/core'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'

interface Props {
  config: DataAnalysisDisplayElement
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

// Fetch colors and time steps from stores
useTaskRunColorsStore()
useAvailableTimeStepsStore()

const userSettings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const collections = useStorage<Collection[]>(
  'weboc-his-collections-v1.0.0',
  [createCollection('Default', props.config)],
  undefined,
  {
    serializer: getDateTimeSerializer(),
  },
)
const selectedCollection = ref<Collection>(collections.value[0])

function deleteSelectedCollection() {
  const index = collections.value.indexOf(selectedCollection.value)
  if (index !== -1) {
    collections.value.splice(index, 1)
    selectedCollection.value =
      collections.value[0] || createCollection('Default', props.config)
  }
}

function addChart(chart: Chart) {
  selectedCollection.value.charts = [chart, ...selectedCollection.value.charts]
}

const requests = computed<ActionRequest[]>((prevRequests) => {
  const newRequests = selectedCollection.value.charts
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) => chart.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key))

  if (
    prevRequests &&
    JSON.stringify(newRequests) === JSON.stringify(prevRequests)
  ) {
    return prevRequests
  }

  return newRequests
})

const timeSeriesOptions = computed(() => ({
  startTime: selectedCollection.value.settings.startTime,
  endTime: selectedCollection.value.settings.endTime,
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  thinning: true,
}))

const { series } = useTimeSeries(baseUrl, requests, timeSeriesOptions)

const tab = ref()
const drawer = ref(false)
watch(tab, () => {
  drawer.value = tab.value !== undefined
})

function isActive(tabName: string) {
  return tab.value === tabName
}

function toggleTab(tabName: string) {
  tab.value = tab.value === tabName ? undefined : tabName
}

const canDoAnalysis = computed(() =>
  hasValidFilterCharts(selectedCollection.value.charts),
)

const tabs = computed(() => [
  {
    value: 'data-selection',
    icon: 'mdi-database',
    text: 'Data Selection',
  },
  {
    value: 'analysis',
    icon: 'mdi-finance',
    text: 'Analysis',
    disabled: !canDoAnalysis.value,
  },
  { value: 'workflows', icon: 'mdi-tools', text: 'Workflows' },
  { value: 'settings', icon: 'mdi-cog-outline', text: 'Settings' },
])

watch(tabs, () => {
  if (!tab.value) return

  // When active tab is disabled, switch to the first enabled tab
  const activeTab = tabs.value.find((t) => t.value === tab.value)
  if (!activeTab || activeTab.disabled) {
    const firstEnabledTab = tabs.value.find((t) => !t.disabled)
    tab.value = firstEnabledTab ? firstEnabledTab.value : undefined
  }
})
</script>
