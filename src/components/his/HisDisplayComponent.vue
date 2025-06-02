<template>
  <div class="his-container">
    <v-navigation-drawer v-model="drawer" width="500" class="his-selection">
      <div v-show="tab === 'data-selection'" class="h-100">
        <HisDataSelection
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
        <HisAnalysis
          :filterId="filterId"
          :charts="selectedCollection.charts"
          :series="series"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          :settings="settings"
          :isLoading="isLoadingActions"
          @addFilter="addFilter"
          @addChart="addChart"
        />
      </div>
      <div v-show="tab === 'settings'">
        <v-card flat title="Settings">
          <v-card-text>
            <div class="d-flex ga-2">
              <v-date-input
                v-model="selectedCollection.settings.startTime"
                label="Start date"
                variant="outlined"
                hide-details
                density="compact"
                prepend-icon=""
                min-width="120"
              />
              <v-date-input
                v-model="selectedCollection.settings.endTime"
                label="End date"
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
    <div class="tab-buttons">
      <v-toolbar-items class="flex-column mt-2 border-e border-t border-b">
        <v-btn
          icon="mdi-chart-line"
          @click="toggleTab('data-selection')"
          height="40"
          :active="isActive('data-selection')"
        />
        <v-btn
          icon="mdi-chart-bar"
          @click="toggleTab('analysis')"
          height="40"
          :active="isActive('analysis')"
        />
        <v-btn
          icon="mdi-cog-outline"
          @click="toggleTab('settings')"
          height="40"
          :active="isActive('settings')"
        />
      </v-toolbar-items>
    </div>
    <div class="his-charts-container">
      <div class="his-charts overflow-y-auto">
        <v-card-title class="flex-0-0 d-flex ga-2 align-center">
          <HisCollection
            v-model:selectedCollection="selectedCollection"
            v-model:collections="collections"
          />
        </v-card-title>
        <HisCollectionCharts
          v-if="selectedCollection.charts.length"
          :collection="selectedCollection"
          :series="series"
          :settings="settings"
          :startTime="selectedCollection.settings.startTime"
          :endTime="selectedCollection.settings.endTime"
          class="flex-1-1"
        />
        <v-card-text v-else> Select some data to display </v-card-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisCollectionCharts from './HisCollectionCharts.vue'
import HisCollection from '@/components/his/HisCollection.vue'
import HisAnalysis from '@/components/his/HisAnalysis.vue'
import { VDateInput } from 'vuetify/labs/components'
import type {
  ActionRequest,
  BoundingBox,
  filterActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { fetchActions } from '@/services/useDisplayConfig'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import {
  type Chart,
  type Collection,
  type FilterChart,
  getDateTimeSerializer,
  createCollection,
  DerivedChart,
  getGenerator,
} from '@/lib/analysis'
import { useUserSettingsStore } from '@/stores/userSettings'
import { Series } from '@/lib/timeseries/timeSeries'
import { difference } from 'lodash-es'
import { useStorage } from '@vueuse/core'
import { TimeSeriesDisplaySubplot } from '@deltares/fews-pi-requests'
import { DataAnalysisDisplay } from '@/services/useDataAnalysisDisplay'

interface Props {
  config: DataAnalysisDisplay
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

function addChartsToCollection(
  subplots: TimeSeriesDisplaySubplot[],
  requests: ActionRequest[],
) {
  const collection = selectedCollection.value
  if (!collection) return

  const newCharts: FilterChart[] = subplots.map((subPlot) => ({
    id: crypto.randomUUID(),
    type: 'filter',
    title: getNewChartTitle(collection),
    subplot: subPlot,
    requests: getActionRequestsForSubplot(subPlot, requests),
  }))

  selectedCollection.value.charts = [...collection.charts, ...newCharts]
}

function getActionRequestsForSubplot(
  subplot: TimeSeriesDisplaySubplot,
  requests: ActionRequest[],
) {
  return subplot.items.flatMap(
    (item) => requests.find((req) => req.key === item.request) ?? [],
  )
}

function getNewChartTitle(collection: Collection) {
  return `Chart ${collection.charts.length + 1}`
}

const filterId = ref(props.config.filters?.[0].id)

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  filterId.value ? [filterId.value] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(baseUrl, filterId)

function addChart(chart: Chart) {
  selectedCollection.value.charts = [...selectedCollection.value.charts, chart]
  if (chart.type === 'derived') {
    updateDependants(chart)
  }
}

const isLoadingActions = ref(false)

async function addFilter(filter: filterActionsFilter) {
  isLoadingActions.value = true
  const actions = await fetchActions(baseUrl, filter)
  isLoadingActions.value = false

  const results = actions.results

  const newSubplots = results.flatMap(
    (result) => result.config?.timeSeriesDisplay.subplots ?? [],
  )
  const newRequests = results
    .flatMap((result) => result.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key))

  addChartsToCollection(newSubplots, newRequests)
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

const { series: fetchedSeries, loadingSeriesIds } = useTimeSeries(
  baseUrl,
  requests,
  () => ({
    startTime: selectedCollection.value.settings.startTime,
    endTime: selectedCollection.value.settings.endTime,
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
    thinning: true,
  }),
)

const generatedSeries = ref<Record<string, Series>>({})

const series = computed(() => ({
  ...fetchedSeries.value,
  ...generatedSeries.value,
}))

watch(
  () =>
    Object.entries(fetchedSeries.value).map(
      ([key, value]) => `${key}-${value.lastUpdated?.getTime()}`,
    ),
  (newValue, oldValue) => {
    const newSeriesIds = difference(newValue, oldValue).map(
      (id) => id.split('-')[0],
    )

    selectedCollection.value.charts
      .filter((chart) => chart.type === 'derived')
      .filter((chart) =>
        chart.dependants.some(
          (dependant) =>
            dependant.seriesIds.some((id) => newSeriesIds.includes(id)) &&
            !dependant.seriesIds.some((id) =>
              loadingSeriesIds.value.includes(id),
            ),
        ),
      )
      .forEach(updateDependants)
  },
)

function updateDependants(chart: DerivedChart) {
  const newSeries = chart.dependants.map((dependant) => {
    const generate = getGenerator(dependant.function)
    return generate(fetchedSeries.value, chart.subplot, dependant.seriesIds)
  })
  Object.assign(generatedSeries.value, ...newSeries)
}

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
</script>

<style scoped>
.his-charts {
  width: 100%;
}

.his-charts-container {
  display: flex;
  justify-content: center;
  flex: 1 1 auto;
  overflow: auto;
}

.tab-buttons {
  flex: 0 0 auto;
}

.his-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
