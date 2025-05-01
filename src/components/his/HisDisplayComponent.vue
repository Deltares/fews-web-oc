<template>
  <div class="his-container pt-2">
    <div class="his-charts h-100 overflow-y-auto">
      <v-card-title class="flex-0-0 d-flex ga-2 align-center">
        <HisMenu
          max-width="700"
          width="100%"
          text="Data selection"
          icon="mdi-filter-plus"
        >
          <template #default="{ isActive }">
            <v-card>
              <HisDataSelection
                :filterId="filterId"
                :locations="locations"
                :geojson="geojson"
                :timeSeriesHeaders="timeSeriesHeaders"
                :boundingBox="boundingBox"
                @addFilter="
                  (filter) => {
                    isActive.value = false
                    addFilter(filter)
                  }
                "
              />
            </v-card>
          </template>
        </HisMenu>
        <HisMenu
          max-width="1200"
          text="Analysis"
          icon="mdi-chart-box-plus-outline"
        >
          <template #default="{ isActive }">
            <v-card>
              <HisAnalysis
                :filterId="filterId"
                :charts="selectedCollection.charts"
                :series="series"
                :startTime="startTime"
                :endTime="endTime"
                :settings="settings"
                @addChart="
                  (chart) => {
                    isActive.value = false
                    addChart(chart)
                  }
                "
                @addFilter="
                  (filter) => {
                    isActive.value = false
                    addFilter(filter)
                  }
                "
              />
            </v-card>
          </template>
        </HisMenu>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisCollectionCharts from './HisCollectionCharts.vue'
import HisCollection from '@/components/his/HisCollection.vue'
import HisAnalysis from '@/components/his/HisAnalysis.vue'
import HisMenu from '@/components/his/HisMenu.vue'
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
import type { Chart, Collection, Dependant, FilterChart } from '@/lib/his'
import { useUserSettingsStore } from '@/stores/userSettings'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

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

  const newCharts: FilterChart[] = subplots.map((subPlot) => ({
    type: 'filter',
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

function addChart(chart: Chart) {
  selectedCollection.value.charts = [...selectedCollection.value.charts, chart]
  if (chart.type === 'derived') {
    updateDependants(chart.dependants)
  }
}

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
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) => chart.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key)),
)

const { series: fetchedSeries } = useTimeSeries(baseUrl, requests, () => ({
  startTime,
  endTime,
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  thinning: true,
}))
watch(fetchedSeries, updateAllDependants)

const generatedSeries = ref<Record<string, Series>>({})

const series = computed(() => ({
  ...fetchedSeries.value,
  ...generatedSeries.value,
}))

function updateDependants(dependants: Dependant[]) {
  dependants.forEach((dependant) => {
    const newSeries = dependant.generateSeries(fetchedSeries.value)
    generatedSeries.value = {
      ...generatedSeries.value,
      ...newSeries,
    }
  })
}

function updateAllDependants() {
  selectedCollection.value.charts.forEach((chart) => {
    if (chart.type === 'derived') {
      updateDependants(chart.dependants)
    }
  })
}
</script>

<style scoped>
.his-charts {
  max-width: 1200px;
  width: 100%;
  height: 100%;
}

.his-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
</style>
