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
          v-model:filterId="filterId"
          :filters="config.filters"
          :locations="locations"
          :geojson="geojson"
          :timeSeriesHeaders="timeSeriesHeaders"
          :boundingBox="boundingBox"
          :isLoading="isLoadingActions"
          @addFilter="addFilter"
        />
      </div>
      <div v-show="tab === 'analysis'" class="h-100">
        <AnalysisFunctions
          :filterId="filterId"
          :charts="selectedCollection.charts"
          :series="series"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          :config="config"
          :settings="settings"
          :isLoading="isLoadingActions"
          @addFilter="addFilter"
          @addChart="addChart"
        />
      </div>
      <div v-show="tab === 'workflows'">
        <AnalysisWorkflows :config="config" @addChart="addChart" />
      </div>
      <div v-show="tab === 'settings'">
        <v-card flat title="Settings">
          <v-card-text>
            <div class="d-flex ga-2">
              <v-date-input
                v-model="selectedCollection.settings.startTime"
                label="Start Date"
                variant="outlined"
                hide-details
                density="compact"
                prepend-icon=""
                min-width="120"
              />
              <v-date-input
                v-model="selectedCollection.settings.endTime"
                label="End Date"
                variant="outlined"
                hide-details
                density="compact"
                prepend-icon=""
                min-width="120"
                display-format="fullDate"
              />
            </div>
          </v-card-text>
        </v-card>
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
    <div class="d-flex justify-center flex-1-1 overflow-auto">
      <div class="w-100 overflow-y-auto">
        <v-card-title class="flex-0-0 d-flex ga-2 align-center">
          <AnalysisCollection
            v-model:selectedCollection="selectedCollection"
            v-model:collections="collections"
          />
        </v-card-title>
        <AnalysisCollectionCharts
          v-if="selectedCollection.charts.length"
          :collection="selectedCollection"
          :series="series"
          :settings="settings"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          class="flex-1-1"
          @addFilter="addFilter"
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
import { VDateInput } from 'vuetify/labs/components'
import type {
  ActionRequest,
  BoundingBox,
  DataAnalysisDisplayElement,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
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
  AddFilter,
  createNewChartsForFilter,
} from '@/lib/analysis'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useStorage } from '@vueuse/core'

interface Props {
  config: DataAnalysisDisplayElement
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const collections = useStorage<Collection[]>(
  'weboc-his-collections-v1.0.0',
  [createCollection('Default')],
  undefined,
  {
    serializer: getDateTimeSerializer(),
  },
)
const selectedCollection = ref<Collection>(collections.value[0])

function addChartsToCollection(charts: Chart[]) {
  const collection = selectedCollection.value
  if (!collection) return

  selectedCollection.value.charts = [...collection.charts, ...charts]
}

const filterId = ref(props.config.filters?.[0].id)

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  filterId.value ? [filterId.value] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(baseUrl, filterId)

function addChart(chart: Chart) {
  selectedCollection.value.charts = [...selectedCollection.value.charts, chart]
}

const isLoadingActions = ref(false)

async function addFilter({ filter, titlePrefix }: AddFilter) {
  isLoadingActions.value = true
  const charts = await createNewChartsForFilter(
    baseUrl,
    filter,
    titlePrefix,
    timeSeriesOptions.value,
  )
  addChartsToCollection(charts)
  isLoadingActions.value = false
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
