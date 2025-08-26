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
          :startTime="startTime"
          :endTime="endTime"
          :config="config"
          :settings="settings"
          @addChart="addChart"
        />
      </div>
      <div v-show="tab === 'workflows'">
        <AnalysisWorkflows :workflows="workflows" @addChart="addChart" />
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
          v-model:selectedCollectionName="selectedCollectionName"
          :collections="collections"
          :config="config"
        />
      </v-card-title>
      <div class="w-100 overflow-y-auto">
        <AnalysisCollectionCharts
          v-if="selectedCollection.charts.length"
          v-model:collection="selectedCollection"
          :series="series"
          :settings="settings"
          :startTime="startTime"
          :endTime="endTime"
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
  createCollection,
  hasValidFilterCharts,
} from '@/lib/analysis'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { useAvailableTimeStepsStore } from '@/stores/availableTimeSteps'
import { addDuration } from '@/lib/date'

interface Props {
  collections: Collection[]
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

const selectedCollectionName = ref<string>(props.collections[0].name)
const selectedCollection = computed<Collection>(() => {
  const collection = props.collections.find(
    (c) => c.name === selectedCollectionName.value,
  )
  if (!collection) {
    throw new Error(
      `Collection with name ${selectedCollectionName.value} not found`,
    )
  }
  return collection
})

function deleteSelectedCollection() {
  const index = props.collections.findIndex(
    (c) => c.name === selectedCollectionName.value,
  )
  if (index !== -1) {
    props.collections.splice(index, 1)
    if (props.collections.length === 0) {
      props.collections.push(createCollection('Default', props.config))
    }
    selectedCollectionName.value = props.collections[0].name
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

const startTime = computed(() => {
  const settings = selectedCollection.value.settings
  const liveUpdate = settings.liveUpdate
  if (liveUpdate.enabled) {
    return addDuration(new Date(), {
      days: -liveUpdate.daysBeforeNow,
    })
  }
  return settings.startTime
})

const endTime = computed(() => {
  const settings = selectedCollection.value.settings
  const liveUpdate = settings.liveUpdate
  if (liveUpdate.enabled) {
    return addDuration(new Date(), {
      days: liveUpdate.daysAfterNow,
    })
  }
  return settings.endTime
})

const timeSeriesOptions = computed(() => ({
  startTime: startTime.value,
  endTime: endTime.value,
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  thinning: true,
}))

const { series } = useTimeSeries(
  baseUrl,
  requests,
  timeSeriesOptions,
  true,
  undefined,
  false,
)

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

const workflows = computed(() => props.config.toolBoxes.toolboxWorkflows ?? [])

const tabs = computed(() =>
  [
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
    {
      value: 'workflows',
      icon: 'mdi-tools',
      text: 'Analysis Workflows',
      enabled: workflows.value.length > 0,
    },
    { value: 'settings', icon: 'mdi-cog-outline', text: 'Settings' },
  ].filter((tab) => tab.enabled !== false),
)

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
