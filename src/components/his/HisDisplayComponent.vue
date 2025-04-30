<template>
  <div class="his-container pa-2 ga-2">
    <div class="his-data-selection h-100 overflow-y-auto">
      <v-card
        border
        flat
        class="pb-2"
        :class="{ 'h-100': tab === 'data-selection' }"
      >
        <v-tabs v-model="tab">
          <v-tab
            prepend-icon="mdi-filter"
            text="Data selection"
            value="data-selection"
            class="text-none"
          />
          <v-tab
            prepend-icon="mdi-chart-line"
            text="Analysis"
            value="analysis"
            :disabled="!selectedCollection.charts.length"
            class="text-none"
          />
        </v-tabs>

        <v-tabs-window v-model="tab" class="h-100">
          <v-tabs-window-item value="data-selection" class="h-100">
            <HisDataSelection
              :filterId="filterId"
              :locations="locations"
              :geojson="geojson"
              :timeSeriesHeaders="timeSeriesHeaders"
              :boundingBox="boundingBox"
              @addFilter="addFilter"
            />
          </v-tabs-window-item>
          <v-tabs-window-item
            value="analysis"
            v-if="selectedCollection.charts.length"
          >
            <HisAnalysis
              :filterId="filterId"
              :charts="selectedCollection.charts"
              :series="series"
              :startTime="startTime"
              :endTime="endTime"
              :settings="settings"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </div>
    <div class="his-charts h-100 overflow-y-auto">
      <v-card border flat class="h-100 d-flex flex-column">
        <v-card-title class="flex-0-0 d-flex ga-1 align-center">
          <div>Charts</div>
          <v-spacer />
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
          class="flex-1-1"
        />
        <v-card-text v-else> Select some data to display </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisCollectionCharts from './HisCollectionCharts.vue'
import HisCollection from '@/components/his/HisCollection.vue'
import HisAnalysis from '@/components/his/HisAnalysis.vue'
import type {
  ActionRequest,
  BoundingBox,
  filterActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { fetchActions } from '@/services/useDisplayConfig'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { Chart, type Collection } from '@/lib/his'
import { useUserSettingsStore } from '@/stores/userSettings'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

const tab = ref('data-selection')

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const collections = ref<Collection[]>([
  {
    name: 'Default',
    charts: [],
  },
])
const selectedCollection = ref<Collection>(collections.value[0])

function addChartsToCollection(
  subplots: ChartConfig[],
  requests: ActionRequest[],
) {
  const collection = selectedCollection.value
  if (!collection) return

  const newCharts: Chart[] = subplots.map((subPlot) => ({
    title: getNewChartTitle(collection),
    config: subPlot,
    requests: getActionRequestsForSubplot(subPlot, requests),
  }))

  selectedCollection.value.charts = [...collection.charts, ...newCharts]
}

function getActionRequestsForSubplot(
  subplot: ChartConfig,
  requests: ActionRequest[],
) {
  return subplot.series.flatMap((series) =>
    series.dataResources.flatMap(
      (resource) => requests.find((req) => req.key === resource) ?? [],
    ),
  )
}

function getNewChartTitle(collection: Collection) {
  return `Chart ${collection.charts.length + 1}`
}

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  props.filterId ? [props.filterId] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(
  baseUrl,
  () => props.filterId,
)

const startTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
const endTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

async function addFilter(filter: filterActionsFilter) {
  const actions = await fetchActions(baseUrl, filter)
  const results = actions.results

  const newSubplots = results.flatMap(
    (result) =>
      result.config?.timeSeriesDisplay.subplots?.map((subPlot) =>
        timeSeriesDisplayToChartConfig(subPlot, [startTime, endTime]),
      ) ?? [],
  )
  const newRequests = results
    .flatMap((result) => result.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key))

  addChartsToCollection(newSubplots, newRequests)
}

const requests = computed(() =>
  selectedCollection.value.charts
    .flatMap((chart) => chart.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key)),
)

const { series } = useTimeSeries(baseUrl, requests, () => ({
  startTime,
  endTime,
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  thinning: true,
}))
</script>

<style scoped>
.his-container {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
  }
}
</style>
